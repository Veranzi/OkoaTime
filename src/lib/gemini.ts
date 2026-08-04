import { GoogleGenAI, ApiError } from "@google/genai";
import type { Part } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

/** Override via GEMINI_MODEL if you want a different Flash (or other) model. */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export { ApiError as GeminiApiError };

/**
 * Gemini's public API doesn't reliably dereference arbitrary external image
 * URLs the way Anthropic's did — fetch the bytes server-side and send them
 * as inline data instead.
 */
export async function imageUrlToPart(url: string): Promise<Part> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { inlineData: { data: buffer.toString("base64"), mimeType } };
}
