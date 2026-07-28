/** Safaricom Daraja expects timestamps as YYYYMMDDHHmmss. */
export function generateMpesaTimestamp(now: Date = new Date()): string {
  return now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

/** Password = base64(Shortcode + Passkey + Timestamp), per Daraja STK push spec. */
export function generateMpesaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}
