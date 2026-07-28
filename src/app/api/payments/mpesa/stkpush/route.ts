import { NextRequest } from "next/server";
import { initiateStkPush } from "@/payments/controller/payment.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return initiateStkPush(req);
}
