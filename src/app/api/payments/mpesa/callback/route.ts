import { NextRequest } from "next/server";
import { handleMpesaCallback } from "@/payments/controller/payment.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleMpesaCallback(req);
}
