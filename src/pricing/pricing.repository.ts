import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DEFAULT_PLATFORM_RATES, type PlatformRates } from "@/lib/utils";
import {
  DEFAULT_PRICING_SETTINGS,
  type DeliveryZone,
  type Offer,
  type PricingSettings,
} from "@/lib/pricing";

// Everything pricing-related goes through the admin SDK on the server, so
// none of it depends on client-side Firestore rules.

// Functions, not constants: adminDb must only be touched inside a request.
const settingsDoc = () => adminDb.collection("settings").doc("platform");
const offersCol = () => adminDb.collection("offers");

function tsToIso(v: unknown): string | null {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  return null;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const snap = await settingsDoc().get();
  const data = snap.exists ? (snap.data() as Record<string, unknown>) : {};
  const settings: PricingSettings = { ...DEFAULT_PRICING_SETTINGS };
  for (const key of Object.keys(DEFAULT_PLATFORM_RATES) as (keyof PlatformRates)[]) {
    if (typeof data[key] === "number") settings[key] = data[key] as number;
  }
  if (Array.isArray(data.deliveryZones) && data.deliveryZones.length > 0) {
    settings.deliveryZones = data.deliveryZones as DeliveryZone[];
  }
  return settings;
}

export async function savePricingSettings(settings: Partial<PricingSettings>, updatedBy: string): Promise<void> {
  await settingsDoc().set({ ...settings, updatedAt: FieldValue.serverTimestamp(), updatedBy }, { merge: true });
}

// ── Offers ─────────────────────────────────────────────────────────────────

export function offerFromDoc(id: string, data: Record<string, unknown>): Offer {
  return {
    ...data,
    id,
    startsAt: tsToIso(data.startsAt),
    endsAt: tsToIso(data.endsAt),
    createdAt: tsToIso(data.createdAt),
  } as Offer;
}

export async function listOffers(): Promise<Offer[]> {
  const snap = await offersCol().get();
  return snap.docs
    .map((d) => offerFromDoc(d.id, d.data()))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function listActiveOffers(kind: Offer["kind"]): Promise<Offer[]> {
  const snap = await offersCol().where("kind", "==", kind).where("active", "==", true).get();
  return snap.docs.map((d) => offerFromDoc(d.id, d.data()));
}

type OfferWrite = Omit<Offer, "id" | "createdAt" | "startsAt" | "endsAt"> & {
  startsAt?: string | null;
  endsAt?: string | null;
};

function toFirestoreDates(o: { startsAt?: string | null; endsAt?: string | null }) {
  return {
    startsAt: o.startsAt ? Timestamp.fromDate(new Date(o.startsAt)) : null,
    endsAt: o.endsAt ? Timestamp.fromDate(new Date(o.endsAt)) : null,
  };
}

export async function createOffer(offer: OfferWrite, createdBy: string): Promise<string> {
  const ref = await offersCol().add({
    ...offer,
    ...toFirestoreDates(offer),
    ...(offer.kind === "customer_discount" ? { usedCount: 0 } : {}),
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateOffer(id: string, patch: Partial<OfferWrite>): Promise<void> {
  const dates = "startsAt" in patch || "endsAt" in patch ? toFirestoreDates(patch) : {};
  // usedCount is only ever changed by order creation.
  const rest: Record<string, unknown> = { ...patch };
  delete rest.usedCount;
  await offersCol().doc(id).update({ ...rest, ...dates, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteOffer(id: string): Promise<void> {
  await offersCol().doc(id).delete();
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUserDoc(uid: string): Promise<Record<string, unknown> | null> {
  const snap = await adminDb.collection("users").doc(uid).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

export async function listUsersByRole(role: string): Promise<{ uid: string; data: Record<string, unknown> }[]> {
  const snap = await adminDb.collection("users").where("role", "==", role).get();
  return snap.docs.map((d) => ({ uid: d.id, data: d.data() }));
}

/** Writes (number) or removes (null) rate override fields on many users at once. */
export async function setUserOverrides(uids: string[], fields: Record<string, number | null>): Promise<void> {
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) update[k] = v === null ? FieldValue.delete() : v;
  // Firestore batches cap at 500 writes.
  for (let i = 0; i < uids.length; i += 450) {
    const batch = adminDb.batch();
    for (const uid of uids.slice(i, i + 450)) batch.update(adminDb.collection("users").doc(uid), update);
    await batch.commit();
  }
}
