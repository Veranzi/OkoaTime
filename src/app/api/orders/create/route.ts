import { NextRequest } from "next/server";
import { postCreateOrder } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

// Orders are priced on the server: the browser sends product ids, quantities,
// the delivery zone and any promo code — never prices or totals.
export async function POST(req: NextRequest) {
  return postCreateOrder(req);
}
