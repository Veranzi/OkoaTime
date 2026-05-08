import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { available } = await req.json();

    await adminDb.collection("users").doc(params.id).update({
      isOnline: available,
      lastSeen: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update availability" }, { status: 500 });
  }
}
