import { App } from "firebase-admin/app";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getApps, initializeApp, cert } = require("firebase-admin/app") as typeof import("firebase-admin/app");

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp!;
  }

  const serviceAccount = process.env.FIREBASE_ADMIN_SDK_KEY
    ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY)
    : undefined;

  if (!serviceAccount) {
    throw new Error("FIREBASE_ADMIN_SDK_KEY is not set");
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  return adminApp!;
}

export function getAdminAuth() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
  return getFirestore(getAdminApp());
}

// Lazy exports — call these functions inside route handlers, not at module top level
export const adminAuth = {
  createUser: (...args: Parameters<ReturnType<typeof import("firebase-admin/auth").getAuth>["createUser"]>) =>
    getAdminAuth().createUser(...args),
  verifyIdToken: (...args: Parameters<ReturnType<typeof import("firebase-admin/auth").getAuth>["verifyIdToken"]>) =>
    getAdminAuth().verifyIdToken(...args),
};

export const adminDb = new Proxy({} as ReturnType<typeof getAdminDb>, {
  get(_target, prop: string) {
    const db = getAdminDb();
    const val = (db as unknown as Record<string, unknown>)[prop];
    if (typeof val === "function") return val.bind(db);
    return val;
  },
});
