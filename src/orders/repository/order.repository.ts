import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export interface OrderRecord {
  id: string;
  customerId: string;
  total: number;
  paymentMethod: "mpesa" | "till";
  paymentStatus: "pending" | "paid" | "failed";
  phone?: string | null;
  customerPhone?: string;
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const snap = await adminDb.collection("orders").doc(orderId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) } as OrderRecord;
}

/** The only place allowed to flip an order's payment outcome — called exclusively by the Payments module. */
export async function markOrderPaymentResult(
  orderId: string,
  result: { paymentStatus: "paid" | "failed" }
): Promise<void> {
  await adminDb.collection("orders").doc(orderId).update({
    paymentStatus: result.paymentStatus,
    ...(result.paymentStatus === "paid" ? { status: "confirmed" } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
