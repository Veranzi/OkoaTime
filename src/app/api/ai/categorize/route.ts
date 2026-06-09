import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PRODUCT_CATEGORIES, SUBCATEGORY_SEEDS } from "@/lib/utils";

const MODEL = "claude-sonnet-4-6";

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

const RESPONSE_SCHEMA = {
  type: "json_schema" as const,
  schema: {
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
  },
};

interface CategorizeBody {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
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

  const content: Anthropic.ContentBlockParam[] = [];
  if (imageUrl) {
    content.push({ type: "image", source: { type: "url", url: imageUrl } });
  }
  const parts = [
    name ? `Product name: ${name}` : "No name provided — identify the product from the photo.",
    body.description?.trim() ? `Supplier description: ${body.description.trim()}` : null,
    "Categorize this product.",
  ].filter(Boolean);
  content.push({ type: "text", text: parts.join("\n") });

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      output_config: { format: RESPONSE_SCHEMA, effort: "low" },
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No suggestion returned" }, { status: 502 });
    }

    const suggestion = JSON.parse(textBlock.text) as Record<string, unknown>;
    if (!PRODUCT_CATEGORIES.includes(suggestion.category as never)) {
      return NextResponse.json({ error: "Could not categorize this product" }, { status: 422 });
    }
    return NextResponse.json(suggestion);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "AI service authentication failed" }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "AI service is busy — try again shortly" }, { status: 429 });
    }
    console.error("categorize error:", err);
    return NextResponse.json({ error: "Categorization failed" }, { status: 500 });
  }
}
