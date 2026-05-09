import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const checkoutRequestId = req.nextUrl.searchParams.get("checkoutRequestId");

  if (!checkoutRequestId) {
    return NextResponse.json({ status: "error", message: "Missing checkoutRequestId" }, { status: 400 });
  }

  try {
    const snapshot = await adminDb
      .collection("payments")
      .where("checkoutRequestId", "==", checkoutRequestId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Record not yet written — still pending
      return NextResponse.json({ status: "pending" });
    }

    const payment = snapshot.docs[0].data();
    return NextResponse.json({
      status: payment.status as "pending" | "completed" | "failed",
      mpesaReceiptNumber: payment.mpesaReceiptNumber ?? null,
      amount: payment.amount ?? null,
      failureReason: payment.failureReason ?? null,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json({ status: "error", message: "Failed to check payment status" }, { status: 500 });
  }
}
