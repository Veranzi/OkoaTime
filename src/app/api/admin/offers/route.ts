import { NextRequest } from "next/server";
import { getOffers, postOffer } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getOffers(req);
}

export async function POST(req: NextRequest) {
  return postOffer(req);
}
