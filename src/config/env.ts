// Centralized, fail-fast accessors for server-only environment variables.
// Never import this from a "use client" file — it throws on missing secrets.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const mpesaEnv = {
  get environment(): "sandbox" | "production" {
    return optional("MPESA_ENV", "sandbox") === "production" ? "production" : "sandbox";
  },
  get consumerKey() {
    return required("MPESA_CONSUMER_KEY");
  },
  get consumerSecret() {
    return required("MPESA_CONSUMER_SECRET");
  },
  get shortcode() {
    return required("MPESA_SHORTCODE");
  },
  get passkey() {
    return required("MPESA_PASSKEY");
  },
  get transactionType() {
    return optional("MPESA_TRANSACTION_TYPE", "CustomerPayBillOnline");
  },
  get callbackUrl() {
    return required("MPESA_CALLBACK_URL");
  },
  get callbackIpAllowlist(): string[] {
    return optional("MPESA_CALLBACK_IP_ALLOWLIST")
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
  },
};
