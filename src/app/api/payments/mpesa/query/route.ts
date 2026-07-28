import { NextRequest } from "next/server";
import { queryPaymentStatus } from "@/payments/controller/payment.controller";

export const dynamic = "force-dynamic";

// Admin-only: manually reconcile a stuck/pending payment against Safaricom's
// STK status-query API — the "Retry status query" admin action.
export async function POST(req: NextRequest) {
  return queryPaymentStatus(req);
}
