import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    let query = adminDb.collection("products").where("available", "==", true);

    if (category) {
      query = query.where("category", "==", category) as typeof query;
    }

    const snapshot = await query.get();
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, products });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplierId, name, category, description, price, imageUrl } = body;

    if (!supplierId || !name || !price) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const docRef = await adminDb.collection("products").add({
      supplierId,
      name,
      category,
      description,
      price: Number(price),
      imageUrl: imageUrl ?? null,
      available: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, productId: docRef.id });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create product" }, { status: 500 });
  }
}
