import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { PaymentError } from "../utils/errors.util";

export interface AuthContext {
  uid: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw new PaymentError("Missing or invalid Authorization header", 401);

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    throw new PaymentError("Invalid or expired session — please sign in again", 401);
  }
}
