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
  // The API shortcode Safaricom issues for Daraja auth (BusinessShortCode +
  // password generation). Can differ from the public till number below.
  get shortcode() {
    return required("MPESA_SHORTCODE");
  },
  get passkey() {
    return required("MPESA_PASSKEY");
  },
  // The actual Till Number customers pay to (PartyB) — kept distinct from
  // the API shortcode above, since Safaricom can issue these as two
  // different numbers for the same till.
  get tillNumber() {
    return required("MPESA_TILL_NUMBER");
  },
  get transactionType() {
    // Defaults to Buy Goods (Till) — override with MPESA_TRANSACTION_TYPE=
    // CustomerPayBillOnline if a Paybill shortcode is ever used instead.
    return optional("MPESA_TRANSACTION_TYPE") || "CustomerBuyGoodsOnline";
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
