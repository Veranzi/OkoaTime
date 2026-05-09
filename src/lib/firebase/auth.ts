import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export type UserRole = "customer" | "supplier" | "rider" | "boat" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "active" | "suspended" | "pending";
  createdAt: unknown;
  // supplier extras
  businessName?: string;
  serviceCategory?: string;
  location?: string;
  // rider extras
  idNumber?: string;
  vehicleType?: string;
  // boat extras
  boatName?: string;
  capacity?: number;
  serviceArea?: string;
}

const googleProvider = new GoogleAuthProvider();

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  businessName?: string;
  serviceCategory?: string;
  location?: string;
  idNumber?: string;
  vehicleType?: string;
  boatName?: string;
  capacity?: number;
  serviceArea?: string;
}) {
  const { email, password, name, ...rest } = data;
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });

  const profile: Omit<UserProfile, "uid"> = {
    name,
    email,
    status: rest.role === "customer" ? "active" : "pending",
    createdAt: serverTimestamp(),
    ...rest,
  };

  await setDoc(doc(db, "users", user.uid), profile);
  return user;
}

export async function loginUser(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      name: user.displayName ?? "",
      email: user.email ?? "",
      phone: user.phoneNumber ?? "",
      role: "customer",
      status: "active",
      createdAt: serverTimestamp(),
    });
  }

  return user;
}

export function setSessionCookie() {
  document.cookie = "session=1; path=/; max-age=86400; SameSite=Lax";
}

export function clearSessionCookie() {
  document.cookie = "session=; path=/; max-age=0";
}

export async function logoutUser() {
  clearSessionCookie();
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export function getRoleRedirect(role: UserRole): string {
  const map: Record<UserRole, string> = {
    customer: "/dashboard",
    supplier: "/supplier",
    rider: "/rider",
    boat: "/boat",
    admin: "/admin",
  };
  return map[role];
}
