import { NextRequest } from "next/server";
import { getMyRatesHandler } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getMyRatesHandler(req);
}
