import { NextRequest } from "next/server";
import { mpesaEnv } from "@/config/env";
import { PaymentError } from "../utils/errors.util";

/**
 * Optional IP allowlist for the Safaricom callback. Safaricom doesn't sign
 * callbacks and doesn't publish a stable IP contract, so this is a no-op
 * unless MPESA_CALLBACK_IP_ALLOWLIST is explicitly configured — the primary
 * defense against forged callbacks is the checkoutRequestId lookup in
 * payment.service (an attacker can't reference a payment attempt they don't
 * already know the ID of).
 */
export function validateWebhookSource(req: NextRequest): void {
  const allowlist = mpesaEnv.callbackIpAllowlist;
  if (allowlist.length === 0) return;

  const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
  const callerIp = forwardedFor.split(",")[0]?.trim();

  if (!callerIp || !allowlist.includes(callerIp)) {
    throw new PaymentError("Callback source not allowed", 403);
  }
}
