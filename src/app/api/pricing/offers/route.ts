import { NextRequest } from "next/server";
import { getPublicOffers } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getPublicOffers(req);
}
