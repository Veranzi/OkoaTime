import { toMpesaPhone } from "@/lib/utils";
import { mpesaConfig } from "@/config/mpesa.config";
import { getOrderById, markOrderPaymentResult } from "@/orders/repository/order.repository";
import {
  acquirePaymentAttempt,
  addAuditLog,
  applyPaymentResult,
  findPaymentByCheckoutRequestId,
  getPaymentById,
  listPayments as repoListPayments,
  recordStkPushOutcome,
  type ListPaymentsFilters,
} from "../repository/payment.repository";
import { submitStkPush } from "./mpesa-stkpush.service";
import { queryStkStatus } from "./mpesa-query.service";
import { PaymentError } from "../utils/errors.util";
import { isTerminalStatus, type Payment } from "../models/payment.model";
import type { MpesaCallbackBody } from "../validators/payment.validators";

export interface InitiatePaymentParams {
  orderId: string;
  uid: string;
  phoneOverride?: string;
}

export interface InitiatePaymentResponse {
  success: true;
  paymentId: string;
  checkoutRequestId: string | null;
  message: string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
  const { orderId, uid, phoneOverride } = params;

  const order = await getOrderById(orderId);
  if (!order) throw new PaymentError("Order not found", 404);
  if (order.customerId !== uid) throw new PaymentError("You do not have access to this order", 403);
  if (order.paymentMethod !== "mpesa") throw new PaymentError("This order is not payable via M-Pesa", 400);
  if (order.paymentStatus === "paid") throw new PaymentError("This order has already been paid", 409);

  const rawPhone = phoneOverride || order.phone || order.customerPhone || "";
  const phone = toMpesaPhone(rawPhone);
  if (!phone || phone.length < 10) throw new PaymentError("A valid M-Pesa phone number is required", 400);

  // Amount is ALWAYS the server-side order total — never trust a client-supplied amount.
  const { payment, reused } = await acquirePaymentAttempt({
    orderId,
    customerId: uid,
    phone,
    amount: order.total,
    environment: mpesaConfig.environment,
  });

  if (reused) {
    if (payment.status === "PENDING" && payment.checkoutRequestId) {
      return {
        success: true,
        paymentId: payment.id,
        checkoutRequestId: payment.checkoutRequestId,
        message: "A payment request is already in progress for this order. Check your phone.",
      };
    }
    // Another request is between "lock acquired" and "STK submitted" — ask the client to wait, not retry immediately.
    return {
      success: true,
      paymentId: payment.id,
      checkoutRequestId: null,
      message: "Payment is already being initiated — please wait a moment.",
    };
  }

  const stkResult = await submitStkPush({ paymentId: payment.id, orderId, phone, amount: order.total });

  if (!stkResult.success) {
    await recordStkPushOutcome({ paymentId: payment.id, orderId, status: "FAILED", resultDesc: stkResult.message });
    throw new PaymentError(stkResult.message, 400);
  }

  await recordStkPushOutcome({
    paymentId: payment.id,
    orderId,
    status: "PENDING",
    checkoutRequestId: stkResult.checkoutRequestId,
    merchantRequestId: stkResult.merchantRequestId,
  });

  return {
    success: true,
    paymentId: payment.id,
    checkoutRequestId: stkResult.checkoutRequestId ?? null,
    message: stkResult.message,
  };
}

export interface PaymentStatusResponse {
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber: string | null;
  failureReason: string | null;
}

function toClientStatus(status: Payment["status"]): PaymentStatusResponse["status"] {
  if (status === "COMPLETED") return "completed";
  if (status === "FAILED" || status === "TIMEOUT") return "failed";
  return "pending";
}

export async function getPaymentStatusByCheckoutRequestId(params: {
  checkoutRequestId: string;
  uid: string;
  isAdmin: boolean;
}): Promise<PaymentStatusResponse> {
  const payment = await findPaymentByCheckoutRequestId(params.checkoutRequestId);
  if (!payment) throw new PaymentError("Payment not found", 404);
  if (payment.customerId !== params.uid && !params.isAdmin) {
    throw new PaymentError("You do not have access to this payment", 403);
  }

  return {
    status: toClientStatus(payment.status),
    mpesaReceiptNumber: payment.mpesaReceiptNumber ?? null,
    failureReason: payment.resultDesc ?? null,
  };
}

/**
 * Applies an already-validated Safaricom callback. Never throws — the caller
 * (the callbacks handler) always ACKs Safaricom regardless of outcome here.
 * Raw-payload audit logging and schema validation happen in the caller,
 * BEFORE this runs, so a bug here can never erase the record of the delivery.
 */
export async function handleMpesaCallback(stkCallback: MpesaCallbackBody["Body"]["stkCallback"]): Promise<void> {
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

  const payment = await findPaymentByCheckoutRequestId(CheckoutRequestID);
  if (!payment) {
    await addAuditLog({
      paymentId: null,
      orderId: null,
      type: "callback_rejected",
      payload: { checkoutRequestId: CheckoutRequestID },
      error: "Unknown checkoutRequestId — no matching payment attempt",
    });
    return;
  }

  const toStatus = ResultCode === 0 ? "COMPLETED" : "FAILED";
  const items = CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;
  const mpesaReceiptNumber = ResultCode === 0 ? String(get("MpesaReceiptNumber") ?? "") : undefined;

  const result = await applyPaymentResult({
    paymentId: payment.id,
    orderId: payment.orderId,
    toStatus,
    source: "callback",
    mpesaReceiptNumber,
    resultCode: ResultCode,
    resultDesc: ResultDesc,
  });

  if (result.duplicate) {
    await addAuditLog({
      paymentId: payment.id,
      orderId: payment.orderId,
      type: "callback_duplicate",
      payload: { checkoutRequestId: CheckoutRequestID, currentStatus: result.payment?.status },
    });
    return;
  }

  if (result.applied) {
    await markOrderPaymentResult(payment.orderId, { paymentStatus: toStatus === "COMPLETED" ? "paid" : "failed" });
  }
}

export async function retryStatusQuery(paymentId: string): Promise<Payment> {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new PaymentError("Payment not found", 404);
  if (!payment.checkoutRequestId) throw new PaymentError("This payment attempt was never sent to Safaricom", 400);
  if (isTerminalStatus(payment.status)) return payment;

  const outcome = await queryStkStatus({
    paymentId: payment.id,
    orderId: payment.orderId,
    checkoutRequestId: payment.checkoutRequestId,
  });

  if (outcome.state === "PENDING") return payment;

  const result = await applyPaymentResult({
    paymentId: payment.id,
    orderId: payment.orderId,
    toStatus: outcome.state,
    source: "admin_retry",
    resultCode: outcome.resultCode,
    resultDesc: outcome.resultDesc,
  });

  if (result.applied) {
    await markOrderPaymentResult(payment.orderId, {
      paymentStatus: outcome.state === "COMPLETED" ? "paid" : "failed",
    });
  }

  return (await getPaymentById(paymentId)) ?? payment;
}

export async function listPayments(filters: ListPaymentsFilters): Promise<Payment[]> {
  return repoListPayments(filters);
}
