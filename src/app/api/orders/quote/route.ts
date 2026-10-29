import { NextRequest } from "next/server";
import { postQuote } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return postQuote(req);
}
