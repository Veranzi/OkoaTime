import { NextRequest, NextResponse } from "next/server";
import type { Content } from "@google/genai";
import { GeminiApiError, getGeminiClient, getGeminiModel, imageUrlToPart } from "@/lib/gemini";
import { PRODUCT_CATEGORIES, SUBCATEGORY_SEEDS } from "@/lib/utils";

const SYSTEM_PROMPT = `You categorize products sold by suppliers on OkoaTime, a delivery marketplace in Lamu, Kenya. Given a product name, an optional description, and an optional photo, infer the product's details.

Rules:
- "category" MUST be exactly one of: ${PRODUCT_CATEGORIES.join(", ")}. This is the top-level routing category — pick the single best fit.
- "subcategory" is a finer grouping. Prefer one of the seed subcategories below for the chosen category if it fits; otherwise propose a new concise lowercase label (1-3 words). Never leave it blank.
- "name" should be a clean, customer-facing product name (fix casing/typos; keep it short).
- "unit" is the selling unit (e.g. kg, piece, pack, bunch, litre, dozen). Pick the most natural unit for this product.
- "description" is one short sentence a shopper would find useful. No marketing fluff. No emojis.

Seed subcategories by category:
${PRODUCT_CATEGORIES.map((c) => `- ${c}: ${SUBCATEGORY_SEEDS[c].join(", ")}`).join("\n")}

If the photo and the typed name disagree, trust the photo for what the product is but keep the supplier's name if it's a reasonable label for that product.`;

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: [...PRODUCT_CATEGORIES] },
    subcategory: { type: "string", description: "Finer grouping label" },
    name: { type: "string", description: "Clean customer-facing name" },
    unit: { type: "string", description: "Selling unit, e.g. kg, piece, pack" },
    description: { type: "string", description: "One short useful sentence" },
  },
  required: ["category", "subcategory", "name", "unit", "description"],
  additionalProperties: false,
};

interface CategorizeBody {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI categorization not configured" }, { status: 500 });
  }

  let body: CategorizeBody;
  try {
    body = (await req.json()) as CategorizeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const imageUrl = body.imageUrl?.trim();
  if (!name && !imageUrl) {
    return NextResponse.json({ error: "Provide a product name or a photo" }, { status: 400 });
  }

  const parts: Content["parts"] = [];
  try {
    if (imageUrl) parts.push(await imageUrlToPart(imageUrl));
  } catch (err) {
    console.error("categorize image fetch error:", err);
    return NextResponse.json({ error: "Could not read the attached photo" }, { status: 400 });
  }

  const textParts = [
    name ? `Product name: ${name}` : "No name provided — identify the product from the photo.",
    body.description?.trim() ? `Supplier description: ${body.description.trim()}` : null,
    "Categorize this product.",
  ].filter(Boolean);
  parts.push({ text: textParts.join("\n") });

  try {
    const response = await getGeminiClient().models.generateContent({
      model: getGeminiModel(),
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
        maxOutputTokens: 512,
      },
    });

    if (!response.text) {
      return NextResponse.json({ error: "No suggestion returned" }, { status: 502 });
    }

    const suggestion = JSON.parse(response.text) as Record<string, unknown>;
    if (!PRODUCT_CATEGORIES.includes(suggestion.category as never)) {
      return NextResponse.json({ error: "Could not categorize this product" }, { status: 422 });
    }
    return NextResponse.json(suggestion);
  } catch (err) {
    if (err instanceof GeminiApiError) {
      if (err.status === 401 || err.status === 403) {
        return NextResponse.json({ error: "AI service authentication failed" }, { status: 500 });
      }
      if (err.status === 429) {
        return NextResponse.json({ error: "AI service is busy — try again shortly" }, { status: 429 });
      }
    }
    console.error("categorize error:", err);
    return NextResponse.json({ error: "Categorization failed" }, { status: 500 });
  }
}
