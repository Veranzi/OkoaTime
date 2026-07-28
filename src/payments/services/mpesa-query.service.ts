import { mpesaEnv } from "@/config/env";
import { mpesaConfig } from "@/config/mpesa.config";
import { generateMpesaPassword, generateMpesaTimestamp } from "../utils/mpesa-crypto.util";
import { withRetry } from "../utils/retry.util";
import { addAuditLog } from "../repository/payment.repository";
import { getMpesaAccessToken } from "./mpesa-oauth.service";

interface StkQueryResponse {
  ResultCode?: string | number;
  ResultDesc?: string;
  errorCode?: string;
  errorMessage?: string;
}

export type StkQueryOutcome =
  | { state: "COMPLETED"; resultCode: number; resultDesc: string }
  | { state: "FAILED"; resultCode: number; resultDesc: string }
  | { state: "PENDING"; resultDesc: string };

/** Read-only reconciliation call — safe to retry on network failure. */
export async function queryStkStatus(params: {
  paymentId: string;
  orderId: string;
  checkoutRequestId: string;
}): Promise<StkQueryOutcome> {
  const { paymentId, orderId, checkoutRequestId } = params;
  const timestamp = generateMpesaTimestamp();
  const password = generateMpesaPassword(mpesaEnv.shortcode, mpesaEnv.passkey, timestamp);

  const requestBody = {
    BusinessShortCode: mpesaEnv.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  await addAuditLog({
    paymentId,
    orderId,
    type: "status_query_request",
    payload: { ...requestBody, Password: "[redacted]" },
  });

  const data = await withRetry(async () => {
    const token = await getMpesaAccessToken();
    const res = await fetch(mpesaConfig.stkQueryUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    return (await res.json()) as StkQueryResponse;
  });

  await addAuditLog({
    paymentId,
    orderId,
    type: "status_query_response",
    payload: data as unknown as Record<string, unknown>,
  });

  // Safaricom returns an errorCode (e.g. 500.001.1001) while the transaction
  // is still being processed — that is NOT a failure, just "not done yet".
  if (data.errorCode && !("ResultCode" in data)) {
    return { state: "PENDING", resultDesc: data.errorMessage ?? "Transaction still being processed" };
  }

  const resultCode = Number(data.ResultCode ?? -1);
  if (resultCode === 0) {
    return { state: "COMPLETED", resultCode, resultDesc: data.ResultDesc ?? "Success" };
  }
  return { state: "FAILED", resultCode, resultDesc: data.ResultDesc ?? "Payment failed or cancelled" };
}
