import { NextRequest, NextResponse } from "next/server";
import type { Content } from "@google/genai";
import { GeminiApiError, getGeminiClient, getGeminiModel, imageUrlToPart } from "@/lib/gemini";
import { PRODUCT_CATEGORIES, SUBCATEGORY_SEEDS } from "@/lib/utils";

const SYSTEM_PROMPT = `You are the product-cataloguing assistant for suppliers on OkoaTime, a delivery marketplace in Lamu, Kenya. Suppliers chat with you to list what they sell. They may type what they have or send a photo of their stock.

Your job each turn:
1. Reply conversationally in "reply" — direct, brief, in plain English. Acknowledge what you saw/understood. Ask a short follow-up only if you genuinely need it. Do not use emojis anywhere in your output. Do not use exclamation marks or filler phrases like "Great!" or "Happy to help!".
2. Whenever the supplier shows or describes sellable items, populate "products" with one entry per distinct product. If they're only chatting or asking a question, return an empty "products" array.

For each product:
- "category" MUST be exactly one of: ${PRODUCT_CATEGORIES.join(", ")}.
- "subcategory": prefer a seed below if it fits, else a concise lowercase label.
- "name": clean, customer-facing.
- "unit": natural selling unit (kg, piece, pack, bunch, litre, dozen, etc.).
- "suggestedPrice": a reasonable retail price in Kenyan Shillings (KES) for the Lamu market as a number. If you truly cannot estimate, use 0.
- "description": one short, useful sentence.

Seed subcategories by category:
${PRODUCT_CATEGORIES.map((c) => `- ${c}: ${SUBCATEGORY_SEEDS[c].join(", ")}`).join("\n")}

Identify what's in any photo even if the supplier types nothing. Trust the photo for what the item is.`;

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Conversational reply to the supplier" },
    products: {
      type: "array",
      description: "Proposed products detected this turn (empty if none)",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: [...PRODUCT_CATEGORIES] },
          subcategory: { type: "string" },
          unit: { type: "string" },
          suggestedPrice: { type: "number", description: "Estimated price in KES, 0 if unsure" },
          description: { type: "string" },
        },
        required: ["name", "category", "subcategory", "unit", "suggestedPrice", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["reply", "products"],
  additionalProperties: false,
};

interface ChatTurn {
  role: "user" | "assistant";
  text?: string;
  imageUrl?: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI assistant not configured" }, { status: 500 });
  }

  let body: { messages?: ChatTurn[] };
  try {
    body = (await req.json()) as { messages?: ChatTurn[] };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const turns = (body.messages ?? []).filter((m) => m.text?.trim() || m.imageUrl);
  if (turns.length === 0) {
    return NextResponse.json({ error: "Send a message or a photo" }, { status: 400 });
  }

  let contents: Content[];
  try {
    contents = await Promise.all(
      turns.map(async (m): Promise<Content> => {
        if (m.role === "assistant") {
          return { role: "model", parts: [{ text: m.text ?? "" }] };
        }
        const parts: Content["parts"] = [];
        if (m.imageUrl) parts.push(await imageUrlToPart(m.imageUrl));
        parts.push({ text: m.text?.trim() || "Look at this photo of my stock." });
        return { role: "user", parts };
      })
    );
  } catch (err) {
    console.error("assistant image fetch error:", err);
    return NextResponse.json({ error: "Could not read the attached photo" }, { status: 400 });
  }

  try {
    const response = await getGeminiClient().models.generateContent({
      model: getGeminiModel(),
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
        maxOutputTokens: 1024,
      },
    });

    if (!response.text) {
      return NextResponse.json({ error: "No reply returned" }, { status: 502 });
    }
    const parsed = JSON.parse(response.text) as Record<string, unknown>;
    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof GeminiApiError) {
      if (err.status === 401 || err.status === 403) {
        return NextResponse.json({ error: "AI service authentication failed" }, { status: 500 });
      }
      if (err.status === 429) {
        return NextResponse.json({ error: "AI service is busy — try again shortly" }, { status: 429 });
      }
    }
    console.error("assistant error:", err);
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}
