import { NextRequest } from "next/server";
import { getPartners, postPartnerRates } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getPartners(req);
}

export async function POST(req: NextRequest) {
  return postPartnerRates(req);
}
