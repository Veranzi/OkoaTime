import { mpesaEnv } from "@/config/env";
import { mpesaConfig } from "@/config/mpesa.config";
import { generateMpesaPassword, generateMpesaTimestamp } from "../utils/mpesa-crypto.util";
import { addAuditLog } from "../repository/payment.repository";
import { getMpesaAccessToken } from "./mpesa-oauth.service";

interface StkPushResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  message: string;
}

/**
 * Submits the STK push to Daraja. Deliberately NOT wrapped in retry logic —
 * Daraja has no client idempotency key, so a retried submit after a network
 * timeout risks sending a second phone prompt for the same attempt. If this
 * fails, the caller marks the payment FAILED and the idempotency lock allows
 * a fresh attempt on the next try.
 */
export async function submitStkPush(params: {
  paymentId: string;
  orderId: string;
  phone: string;
  amount: number;
}): Promise<StkPushResult> {
  const { paymentId, orderId, phone, amount } = params;
  const timestamp = generateMpesaTimestamp();
  const password = generateMpesaPassword(mpesaEnv.shortcode, mpesaEnv.passkey, timestamp);

  const requestBody = {
    BusinessShortCode: mpesaEnv.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: mpesaEnv.transactionType,
    Amount: Math.ceil(amount),
    PartyA: phone,
    // PartyB is the actual Till Number customers pay to — distinct from
    // BusinessShortCode, which is the API credential used to authenticate
    // and generate the password.
    PartyB: mpesaEnv.tillNumber,
    PhoneNumber: phone,
    CallBackURL: mpesaEnv.callbackUrl,
    AccountReference: orderId,
    TransactionDesc: `OkoaTime Order ${orderId}`,
  };

  await addAuditLog({
    paymentId,
    orderId,
    type: "stkpush_request",
    payload: { ...requestBody, Password: "[redacted]" },
  });

  const token = await getMpesaAccessToken();

  let data: StkPushResponse;
  let statusCode = 0;
  try {
    const res = await fetch(mpesaConfig.stkPushUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    statusCode = res.status;
    data = (await res.json()) as StkPushResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error contacting Safaricom";
    await addAuditLog({
      paymentId,
      orderId,
      type: "stkpush_response",
      payload: {},
      error: message,
    });
    return { success: false, message };
  }

  await addAuditLog({
    paymentId,
    orderId,
    type: "stkpush_response",
    payload: data as unknown as Record<string, unknown>,
    statusCode,
  });

  if (data.ResponseCode === "0" && data.CheckoutRequestID) {
    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      message: data.CustomerMessage ?? "STK push sent. Check your phone.",
    };
  }

  return {
    success: false,
    message: data.errorMessage ?? data.ResponseDescription ?? "STK push failed",
  };
}
