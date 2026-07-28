// Generic exponential-backoff retry — intended ONLY for network-level
// failures on idempotent/read-like calls (OAuth token fetch, status query).
// Never wrap a non-idempotent write like the STK push submit itself: a
// timed-out submit may still have reached Safaricom, and retrying risks
// sending a second phone prompt for the same attempt.
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const delay = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
