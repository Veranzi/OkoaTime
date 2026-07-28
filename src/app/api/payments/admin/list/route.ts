import { NextRequest } from "next/server";
import { listPaymentsHandler } from "@/payments/controller/payment.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return listPaymentsHandler(req);
}
