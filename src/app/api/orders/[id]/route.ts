import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await adminDb.collection("orders").doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order: { id: doc.id, ...doc.data() } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, riderId } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status) updateData.status = status;
    if (riderId !== undefined) updateData.riderId = riderId;

    await adminDb.collection("orders").doc(params.id).update(updateData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update order" }, { status: 500 });
  }
}
