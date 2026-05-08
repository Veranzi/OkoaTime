import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, ...rest } = body;

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone.startsWith("+") ? phone : `+254${phone.slice(1)}`,
    });

    await adminDb.collection("users").doc(firebaseUser.uid).set({
      name,
      email,
      phone,
      role,
      status: role === "customer" ? "active" : "pending",
      createdAt: FieldValue.serverTimestamp(),
      ...rest,
    });

    return NextResponse.json({ success: true, uid: firebaseUser.uid });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
