import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../middleware/require-auth";
import { requireAdmin } from "../middleware/require-admin";
import { validateWebhookSource } from "../middleware/validate-webhook-source";
import { processMpesaCallback } from "../callbacks/mpesa-callback.handler";
import {
  StkPushRequestSchema,
  StatusQuerySchema,
  AdminListPaymentsQuerySchema,
  RetryQuerySchema,
} from "../validators/payment.validators";
import {
  getPaymentStatusByCheckoutRequestId,
  initiatePayment,
  listPayments,
  retryStatusQuery,
} from "../services/payment.service";
import { PaymentError } from "../utils/errors.util";
import type { Payment } from "../models/payment.model";

function errorResponse(err: unknown): NextResponse {
  if (err instanceof PaymentError) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.statusCode });
  }
  console.error("Unhandled payments error:", err);
  return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
}

export async function initiateStkPush(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAuth(req);
    const body = await req.json();
    const parsed = StkPushRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing or invalid orderId" }, { status: 400 });
    }

    const result = await initiatePayment({ orderId: parsed.data.orderId, uid, phoneOverride: parsed.data.phone });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function getPaymentStatus(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAuth(req);
    const parsed = StatusQuerySchema.safeParse({
      checkoutRequestId: req.nextUrl.searchParams.get("checkoutRequestId"),
    });
    if (!parsed.success) {
      return NextResponse.json({ status: "error", message: "Missing checkoutRequestId" }, { status: 400 });
    }

    const result = await getPaymentStatusByCheckoutRequestId({
      checkoutRequestId: parsed.data.checkoutRequestId,
      uid,
      isAdmin: false,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ status: "error", message: err.message }, { status: err.statusCode });
    }
    console.error("Payment status error:", err);
    return NextResponse.json({ status: "error", message: "Failed to check payment status" }, { status: 500 });
  }
}

/** Always ACKs Safaricom with HTTP 200 to avoid callback-retry storms — errors are audit-logged, not surfaced over HTTP. */
export async function handleMpesaCallback(req: NextRequest): Promise<NextResponse> {
  try {
    validateWebhookSource(req);
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected" }, { status: err.statusCode });
    }
    throw err;
  }

  const rawBody = await req.json().catch(() => ({}));
  await processMpesaCallback(rawBody);
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

/**
 * Firestore Timestamp objects (createdAt/updatedAt) serialize over JSON as
 * `{_seconds, _nanoseconds}`, not the live object with a `.toDate()` method —
 * the admin UI's date formatting crashes the whole page render on that shape.
 * Convert to ISO strings before responding.
 */
function toTimestampIso(value: unknown): string | undefined {
  const ts = value as { toDate?: () => Date } | undefined;
  return typeof ts?.toDate === "function" ? ts.toDate().toISOString() : undefined;
}

function serializePayment(payment: Payment): Payment {
  return {
    ...payment,
    createdAt: toTimestampIso(payment.createdAt) ?? null,
    updatedAt: toTimestampIso(payment.updatedAt) ?? null,
  };
}

export async function queryPaymentStatus(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const parsed = RetryQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing paymentId" }, { status: 400 });
    }

    const payment = await retryStatusQuery(parsed.data.paymentId);
    return NextResponse.json({ success: true, payment: serializePayment(payment) });
  } catch (err) {
    return errorResponse(err);
  }
}

function parseListFilters(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return AdminListPaymentsQuerySchema.parse({
    status: sp.get("status") ?? undefined,
    search: sp.get("search") ?? undefined,
    startDate: sp.get("startDate") ?? undefined,
    endDate: sp.get("endDate") ?? undefined,
  });
}

export async function listPaymentsHandler(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    const filters = parseListFilters(req);
    const payments = await listPayments(filters);
    return NextResponse.json({ success: true, payments: payments.map(serializePayment) });
  } catch (err) {
    return errorResponse(err);
  }
}

function toCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function exportPaymentsHandler(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    const filters = parseListFilters(req);
    const payments = await listPayments(filters);

    const header = [
      "id",
      "orderId",
      "customerId",
      "phone",
      "amount",
      "status",
      "checkoutRequestId",
      "mpesaReceiptNumber",
      "resultDesc",
      "createdAt",
    ];
    const rows = payments.map((p) =>
      [
        p.id,
        p.orderId,
        p.customerId,
        p.phone,
        p.amount,
        p.status,
        p.checkoutRequestId ?? "",
        p.mpesaReceiptNumber ?? "",
        p.resultDesc ?? "",
        toTimestampIso(p.createdAt) ?? "",
      ]
        .map(toCsvValue)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="okoatime-payments.csv"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
