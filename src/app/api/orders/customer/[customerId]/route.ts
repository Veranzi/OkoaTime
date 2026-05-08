import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(_req: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const snapshot = await adminDb
      .collection("orders")
      .where("customerId", "==", params.customerId)
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, orders });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 });
  }
}
