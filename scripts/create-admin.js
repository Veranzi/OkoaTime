/**
 * Creates (or updates) a single admin account. No demo data. Safe to rerun.
 * Reads .env.local (dev) by default; set ENV_FILE=.env.prod.local for production.
 *
 * Usage:
 *   PowerShell:  $env:ADMIN_EMAIL='info@okoatime.com'; $env:ADMIN_PASSWORD='...'; $env:ADMIN_NAME='OkoaTime Admin'; $env:ADMIN_PHONE='0707132823'; node scripts/create-admin.js
 *   bash:        ADMIN_EMAIL=info@okoatime.com ADMIN_PASSWORD='...' ADMIN_NAME='OkoaTime Admin' ADMIN_PHONE=0707132823 node scripts/create-admin.js
 */
const fs = require("fs");
const path = require("path");

const envFile = process.env.ENV_FILE || ".env.local";
const raw = fs.readFileSync(path.join(__dirname, "..", envFile), "utf8");
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = value;
}

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "OkoaTime Admin", ADMIN_PHONE } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required. See usage at the top of this file.");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY)),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth();
const db = getFirestore();

async function main() {
  console.log(`Env file: ${envFile}`);
  console.log(`Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);

  const authFields = { password: ADMIN_PASSWORD, displayName: ADMIN_NAME };
  if (ADMIN_PHONE) authFields.phoneNumber = ADMIN_PHONE.startsWith("+") ? ADMIN_PHONE : `+254${ADMIN_PHONE.slice(1)}`;

  let uid;
  try {
    uid = (await auth.getUserByEmail(ADMIN_EMAIL)).uid;
    await auth.updateUser(uid, authFields);
    console.log(`Updated existing auth user ${uid}`);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    uid = (await auth.createUser({ email: ADMIN_EMAIL, ...authFields })).uid;
    console.log(`Created auth user ${uid}`);
  }

  const ref = db.collection("users").doc(uid);
  const existing = await ref.get();
  await ref.set(
    {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      ...(ADMIN_PHONE ? { phone: ADMIN_PHONE } : {}),
      role: "admin",
      status: "active",
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );
  console.log(`Admin profile ready: ${ADMIN_EMAIL}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
