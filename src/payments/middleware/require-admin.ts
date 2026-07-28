import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { PaymentError } from "../utils/errors.util";
import { requireAuth, type AuthContext } from "./require-auth";

export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const auth = await requireAuth(req);

  const userSnap = await adminDb.collection("users").doc(auth.uid).get();
  const role = userSnap.exists ? (userSnap.data()?.role as string | undefined) : undefined;
  if (role !== "admin") throw new PaymentError("Admin access required", 403);

  return auth;
}
