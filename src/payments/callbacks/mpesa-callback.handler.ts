import { addAuditLog } from "../repository/payment.repository";
import { MpesaCallbackSchema } from "../validators/payment.validators";
import { handleMpesaCallback } from "../services/payment.service";

/**
 * Validates and applies an inbound Safaricom STK callback. Always resolves —
 * never throws — so the route handler can unconditionally ACK Safaricom and
 * avoid callback-retry storms. Every delivery is audit-logged first, before
 * any validation or status-transition logic runs.
 */
export async function processMpesaCallback(rawBody: unknown): Promise<void> {
  await addAuditLog({
    paymentId: null,
    orderId: null,
    type: "callback_received",
    payload: { raw: rawBody as Record<string, unknown> },
  });

  const parsed = MpesaCallbackSchema.safeParse(rawBody);
  if (!parsed.success) {
    await addAuditLog({
      paymentId: null,
      orderId: null,
      type: "callback_rejected",
      payload: { raw: rawBody as Record<string, unknown> },
      error: `Schema validation failed: ${parsed.error.message}`,
    });
    return;
  }

  try {
    await handleMpesaCallback(parsed.data.Body.stkCallback);
  } catch (err) {
    await addAuditLog({
      paymentId: null,
      orderId: null,
      type: "error",
      payload: { checkoutRequestId: parsed.data.Body.stkCallback.CheckoutRequestID },
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
