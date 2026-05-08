import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ success: false, message: "Invalid coordinates" }, { status: 400 });
    }

    // Update Firestore for general rider data
    await adminDb.collection("riderLocations").doc(params.id).set(
      { lat, lng, updatedAt: FieldValue.serverTimestamp(), riderId: params.id },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update location" }, { status: 500 });
  }
}
