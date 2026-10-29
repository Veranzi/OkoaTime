import { NextRequest } from "next/server";
import { getSettings, putSettings } from "@/pricing/pricing.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getSettings(req);
}

export async function PUT(req: NextRequest) {
  return putSettings(req);
}
