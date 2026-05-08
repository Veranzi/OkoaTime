import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, supplierId, items, deliveryAddress, paymentMethod, phone, notes, category } = body;

    if (!customerId || !items?.length || !deliveryAddress) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const deliveryFee = 150;
    const totalAmount = subtotal + deliveryFee;

    const orderId = `OT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const orderData = {
      orderId,
      customerId,
      supplierId: supplierId ?? null,
      riderId: null,
      items,
      category,
      status: "pending",
      totalAmount,
      deliveryFee,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending" : "initiated",
      phone: phone ?? null,
      notes: notes ?? "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection("orders").doc(orderId).set(orderData);

    return NextResponse.json({ success: true, orderId, totalAmount });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 });
  }
}
