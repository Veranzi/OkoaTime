import { mpesaEnv } from "@/config/env";
import { mpesaConfig } from "@/config/mpesa.config";
import { withRetry } from "../utils/retry.util";
import { addAuditLog } from "../repository/payment.repository";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Module-scope cache — reused across requests served by the same warm
// server instance. Safaricom tokens are valid ~3600s; refresh 60s early.
let cachedToken: CachedToken | null = null;

interface OAuthResponse {
  access_token?: string;
  expires_in?: string;
  error?: string;
  errorMessage?: string;
}

export async function getMpesaAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const auth = Buffer.from(`${mpesaEnv.consumerKey}:${mpesaEnv.consumerSecret}`).toString("base64");

  let data: OAuthResponse;
  try {
    data = await withRetry(async () => {
      const res = await fetch(mpesaConfig.oauthUrl, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const body = (await res.json()) as OAuthResponse;
      if (!res.ok || !body.access_token) {
        throw new Error(body.errorMessage ?? body.error ?? "Failed to obtain M-Pesa access token");
      }
      return body;
    });
  } catch (err) {
    await addAuditLog({
      paymentId: null,
      orderId: null,
      type: "oauth_token_request",
      payload: { environment: mpesaConfig.environment },
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  await addAuditLog({
    paymentId: null,
    orderId: null,
    type: "oauth_token_request",
    payload: { environment: mpesaConfig.environment, success: true },
  });

  const ttlSeconds = Number(data.expires_in ?? "3600");
  cachedToken = {
    accessToken: data.access_token!,
    expiresAt: Date.now() + Math.max(0, ttlSeconds - 60) * 1000,
  };

  return cachedToken.accessToken;
}
