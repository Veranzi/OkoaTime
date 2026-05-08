import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: { Name: string; Value: string | number }[];
      };
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as MpesaCallbackBody;
    const { stkCallback } = body.Body;
    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = stkCallback;

    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item ?? [];
      const get = (name: string) => metadata.find((i) => i.Name === name)?.Value;

      const mpesaReceiptNumber = String(get("MpesaReceiptNumber") ?? "");
      const amount = Number(get("Amount") ?? 0);
      const phoneNumber = String(get("PhoneNumber") ?? "");
      const transactionDate = String(get("TransactionDate") ?? "");

      // Find order by CheckoutRequestID and update payment status
      const snapshot = await adminDb
        .collection("payments")
        .where("checkoutRequestId", "==", CheckoutRequestID)
        .get();

      const batch = adminDb.batch();

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: "completed",
          mpesaReceiptNumber,
          amount,
          phoneNumber,
          transactionDate,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Also update the related order
        if (doc.data().orderId) {
          const orderRef = adminDb.collection("orders").doc(doc.data().orderId as string);
          batch.update(orderRef, {
            paymentStatus: "paid",
            status: "confirmed",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });

      await batch.commit();
    } else {
      // Payment failed — update payment record
      const snapshot = await adminDb
        .collection("payments")
        .where("checkoutRequestId", "==", CheckoutRequestID)
        .get();

      for (const doc of snapshot.docs) {
        await doc.ref.update({
          status: "failed",
          failureReason: ResultDesc,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }, { status: 500 });
  }
}
