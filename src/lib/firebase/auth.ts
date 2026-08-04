import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  reauthenticateWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
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
// Force the account chooser every time, instead of Google silently
// re-using whichever account is already signed into the browser.
googleProvider.setCustomParameters({ prompt: "select_account" });

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

// Popup-based Google sign-in (signInWithPopup) relies on the opener window
// polling the popup's `.closed` state — Chrome's Cross-Origin-Opener-Policy
// enforcement on Google's own accounts.google.com pages blocks that even
// when our page sets a permissive COOP header, leaving the popup flow
// hanging silently. signInWithRedirect avoids the popup entirely: it
// navigates the whole page to Google and back, so there's no cross-window
// reference to be blocked.
export async function loginWithGoogle() {
  await signInWithRedirect(auth, googleProvider);
}

/** Call on mount of any page that renders the Google sign-in button, to pick up the result after the redirect back. */
export async function completeGoogleRedirect() {
  const result = await getRedirectResult(auth);
  if (!result) return null;
  const { user } = result;

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

// ── Inactivity lock screen — confirms it's still the signed-in user without
// disturbing their session (no logout, no re-fetching their data) ─────────

/** Whether the current user can unlock with a password (vs. Google-only accounts). */
export function hasPasswordProvider(): boolean {
  return auth.currentUser?.providerData.some((p) => p.providerId === "password") ?? false;
}

export async function unlockWithPassword(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("No signed-in user");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

const UNLOCK_REDIRECT_PENDING_KEY = "okoatime_unlock_pending";

/** For Google-only accounts — same COOP-hang problem as sign-in, so use redirect here too. */
export async function unlockWithGoogleRedirect(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No signed-in user");
  sessionStorage.setItem(UNLOCK_REDIRECT_PENDING_KEY, "1");
  await reauthenticateWithRedirect(user, googleProvider);
}

/**
 * Call on app mount to pick up the result of an unlockWithGoogleRedirect()
 * round-trip. Gated on the sessionStorage flag so this never races with
 * completeGoogleRedirect() consuming the SAME redirect result on the login
 * page for an actual sign-in.
 */
export async function completeUnlockRedirect(): Promise<boolean> {
  if (typeof window === "undefined" || sessionStorage.getItem(UNLOCK_REDIRECT_PENDING_KEY) !== "1") {
    return false;
  }
  sessionStorage.removeItem(UNLOCK_REDIRECT_PENDING_KEY);
  const result = await getRedirectResult(auth);
  return !!result;
}
