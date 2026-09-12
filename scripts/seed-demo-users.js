/**
 * Creates one demo account per role (customer, supplier, rider, boat, admin)
 * plus enough sample data for each to be demoable on camera, against
 * whichever Firebase project this repo's .env.local points at.
 *
 * Idempotent: rerunning updates the same 5 accounts instead of duplicating
 * them, and only seeds products/orders/bookings once per role (tagged with
 * SEED_TAG so a rerun can tell they already exist).
 *
 * Usage:
 *   PowerShell:  $env:SEED_PASSWORD = 'YourPassword123!'; node scripts/seed-demo-users.js
 *   bash:        SEED_PASSWORD='YourPassword123!' node scripts/seed-demo-users.js
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth();
const db = getFirestore();

const SEED_TAG = "okoatime-demo-v1";

const DEMO_PASSWORD = process.env.SEED_PASSWORD;
if (!DEMO_PASSWORD) {
  console.error(
    "SEED_PASSWORD is not set.\n" +
    "Set it before running, e.g.:\n" +
    "  PowerShell:  $env:SEED_PASSWORD = 'YourPassword123!'; node scripts/seed-demo-users.js\n" +
    "  bash:        SEED_PASSWORD='YourPassword123!' node scripts/seed-demo-users.js"
  );
  process.exit(1);
}

const ROLES = [
  {
    role: "customer",
    email: "demo.customer@okoatime.demo",
    name: "Amina Demo",
    phone: "0700000001",
    extra: {},
  },
  {
    role: "supplier",
    email: "demo.supplier@okoatime.demo",
    name: "Baraka Demo",
    phone: "0700000002",
    extra: {
      businessName: "Baraka Seafood Co.",
      serviceCategory: "seafood",
      location: "Lamu Old Town",
    },
  },
  {
    role: "rider",
    email: "demo.rider@okoatime.demo",
    name: "Juma Demo",
    phone: "0700000003",
    extra: { idNumber: "12345678", vehicleType: "motorbike" },
  },
  {
    role: "boat",
    email: "demo.boat@okoatime.demo",
    name: "Hassan Demo",
    phone: "0700000004",
    extra: { boatName: "Bahari Express", capacity: 8, serviceArea: "Lamu - Shela - Manda" },
  },
  {
    role: "admin",
    email: "demo.admin@okoatime.demo",
    name: "Demo Admin",
    phone: "0700000005",
    extra: {},
  },
];

async function upsertAuthUser({ email, password, name, phone }) {
  const phoneNumber = phone.startsWith("+") ? phone : `+254${phone.slice(1)}`;
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, displayName: name, phoneNumber });
    return existing.uid;
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    const created = await auth.createUser({ email, password, displayName: name, phoneNumber });
    return created.uid;
  }
}

async function upsertUserProfile(uid, fields) {
  await db.collection("users").doc(uid).set(
    {
      ...fields,
      status: "active",
      seedTag: SEED_TAG,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function alreadySeeded(collectionName, ownerField, ownerId) {
  const snap = await db
    .collection(collectionName)
    .where(ownerField, "==", ownerId)
    .where("seedTag", "==", SEED_TAG)
    .limit(1)
    .get();
  return !snap.empty;
}

async function seedProducts(supplierId, supplierName) {
  if (await alreadySeeded("products", "supplierId", supplierId)) {
    console.log("  products already seeded, skipping");
    return;
  }
  const products = [
    { name: "Fresh Red Snapper", category: "seafood", subcategory: "fish", price: 600, unit: "kg", description: "Line-caught red snapper, cleaned and ready to cook." },
    { name: "King Prawns", category: "seafood", subcategory: "shellfish", price: 1200, unit: "kg", description: "Jumbo king prawns, fresh off the boat." },
    { name: "Blue Swimming Crab", category: "seafood", subcategory: "shellfish", price: 900, unit: "kg", description: "Whole blue swimming crab, sold live or cleaned." },
    { name: "Lobster Tail", category: "seafood", subcategory: "shellfish", price: 1500, unit: "piece", description: "Premium lobster tail, ideal for grilling." },
  ];
  const batch = db.batch();
  for (const p of products) {
    const ref = db.collection("products").doc();
    batch.set(ref, {
      ...p,
      supplierId,
      supplierName,
      available: true,
      seedTag: SEED_TAG,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`  seeded ${products.length} products`);
}

async function seedOrders({ customerId, customerName, customerPhone, supplierId, supplierName, riderId, riderName }) {
  if (await alreadySeeded("orders", "customerId", customerId)) {
    console.log("  orders already seeded, skipping");
    return;
  }
  const baseItems = [
    { name: "Fresh Red Snapper", quantity: 2, price: 600 },
    { name: "King Prawns", quantity: 1, price: 1200 },
  ];
  const subtotal = baseItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const deliveryFee = 150;

  const common = {
    customerId,
    customerName,
    customerPhone,
    category: "seafood",
    categories: ["seafood"],
    items: baseItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryAddress: "Lamu Old Town Jetty, near the market",
    paymentMethod: "mpesa",
    paymentStatus: "paid",
    deliveryType: "bike",
    supplierId,
    supplierName,
    seedTag: SEED_TAG,
  };

  const batch = db.batch();

  // Past order — delivery history for customer/supplier/rider.
  batch.set(db.collection("orders").doc(), {
    ...common,
    status: "delivered",
    riderId,
    riderName,
    riderPayout: Math.round(deliveryFee * 0.7),
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // In-progress order — shows as the rider's active delivery.
  batch.set(db.collection("orders").doc(), {
    ...common,
    status: "rider_assigned",
    riderId,
    riderName,
    riderPayout: Math.round(deliveryFee * 0.7),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Ready, unassigned order — shows up in the rider's "Available Orders" list.
  batch.set(db.collection("orders").doc(), {
    ...common,
    status: "ready",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  console.log("  seeded 3 orders (delivered / rider_assigned / ready)");
}

async function seedBookings(boatOperatorId) {
  if (await alreadySeeded("bookings", "boatOperatorId", boatOperatorId)) {
    console.log("  bookings already seeded, skipping");
    return;
  }
  const bookings = [
    {
      customerName: "Fatuma Guest",
      customerPhone: "+254700000099",
      route: "Lamu - Shela",
      datetime: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
      passengers: 4,
      amount: 4000,
      commission: 400,
      net: 3600,
      status: "pending",
    },
    {
      customerName: "Omar Guest",
      customerPhone: "+254700000098",
      route: "Shela - Manda Island",
      datetime: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
      passengers: 2,
      amount: 2500,
      commission: 250,
      net: 2250,
      status: "confirmed",
    },
  ];
  const batch = db.batch();
  for (const b of bookings) {
    const ref = db.collection("bookings").doc();
    batch.set(ref, {
      ...b,
      boatOperatorId,
      seedTag: SEED_TAG,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`  seeded ${bookings.length} bookings`);
}

async function main() {
  const uids = {};

  for (const r of ROLES) {
    console.log(`\n${r.role}: ${r.email}`);
    const uid = await upsertAuthUser({ email: r.email, password: DEMO_PASSWORD, name: r.name, phone: r.phone });
    await upsertUserProfile(uid, { name: r.name, email: r.email, phone: r.phone, role: r.role, ...r.extra });
    uids[r.role] = uid;
    console.log(`  uid: ${uid}`);
  }

  console.log("\nSeeding sample data...");

  console.log("supplier:");
  await seedProducts(uids.supplier, "Baraka Seafood Co.");

  console.log("orders (customer/supplier/rider):");
  await seedOrders({
    customerId: uids.customer,
    customerName: "Amina Demo",
    customerPhone: "0700000001",
    supplierId: uids.supplier,
    supplierName: "Baraka Seafood Co.",
    riderId: uids.rider,
    riderName: "Juma Demo",
  });

  console.log("boat:");
  await seedBookings(uids.boat);

  console.log("\nDone. Demo accounts (all share one password):\n");
  console.log(`  password: ${DEMO_PASSWORD}\n`);
  for (const r of ROLES) {
    console.log(`  ${r.role.padEnd(9)} ${r.email}`);
  }
  console.log("\nEvery seeded doc is tagged seedTag: \"" + SEED_TAG + "\" for easy cleanup later.");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
