"use client";
// Browser-side calls to the pricing API. All pricing reads and writes go
// through the server (admin SDK), never straight to Firestore.

import { auth } from "@/lib/firebase/config";
import { DEFAULT_PLATFORM_RATES, type PlatformRates } from "@/lib/utils";
import type {
  CustomerDiscountOffer,
  EffectiveRates,
  Offer,
  PartnerRole,
  PricingSettings,
  Quote,
} from "@/lib/pricing";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  await auth.authStateReady(); // pages can mount before Firebase restores the session
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again.");
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string } & T;
  if (!res.ok || data.success === false) throw new Error(data.message || "Request failed");
  return data;
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getPricingSettings(): Promise<PricingSettings> {
  return (await api<{ settings: PricingSettings }>("/api/pricing/settings")).settings;
}

export async function savePricingSettings(settings: Partial<PricingSettings>): Promise<PricingSettings> {
  return (await api<{ settings: PricingSettings }>("/api/pricing/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  })).settings;
}

/** Platform default rates (no individual overrides or promos). */
export async function getPlatformRates(): Promise<PlatformRates> {
  const s = await getPricingSettings();
  const rates = { ...DEFAULT_PLATFORM_RATES };
  for (const k of Object.keys(rates) as (keyof PlatformRates)[]) rates[k] = s[k];
  return rates;
}

// ── Partner rates ──────────────────────────────────────────────────────────

export type MyRates = EffectiveRates & { role: string | null; defaults: PlatformRates };

/** The rates that apply to the signed-in partner right now (promo > own rate > default). */
export async function getMyRates(): Promise<MyRates> {
  return api<MyRates>("/api/pricing/my-rates");
}

export interface PartnerRow extends EffectiveRates {
  uid: string;
  name: string;
  displayName: string;
  status: string;
}

export async function getPartners(role: PartnerRole): Promise<PartnerRow[]> {
  return (await api<{ partners: PartnerRow[] }>(`/api/admin/pricing/partners?role=${role}`)).partners;
}

export async function applyPartnerRates(body: {
  role: PartnerRole;
  target: "all" | "selected";
  uids?: string[];
  action: "set" | "reset";
  rates?: Partial<PlatformRates>;
  clearOverrides?: boolean;
}): Promise<number> {
  return (await api<{ updated: number }>("/api/admin/pricing/partners", {
    method: "POST",
    body: JSON.stringify(body),
  })).updated;
}

// ── Offers ─────────────────────────────────────────────────────────────────

export async function listOffers(): Promise<Offer[]> {
  return (await api<{ offers: Offer[] }>("/api/admin/offers")).offers;
}

export async function createOffer(offer: Record<string, unknown>): Promise<string> {
  return (await api<{ id: string }>("/api/admin/offers", { method: "POST", body: JSON.stringify(offer) })).id;
}

export async function setOfferActive(id: string, active: boolean): Promise<void> {
  await api(`/api/admin/offers/${id}`, { method: "PATCH", body: JSON.stringify({ active }) });
}

export async function deleteOffer(id: string): Promise<void> {
  await api(`/api/admin/offers/${id}`, { method: "DELETE" });
}

export type PublicOffer = Pick<CustomerDiscountOffer, "id" | "name" | "appliesTo" | "discountType" | "value" | "zoneIds" | "minSubtotal" | "endsAt">;

/** Automatic customer offers running now (no promo codes). */
export async function getPublicOffers(): Promise<PublicOffer[]> {
  return (await api<{ offers: PublicOffer[] }>("/api/pricing/offers")).offers;
}

// ── Checkout ───────────────────────────────────────────────────────────────

export interface CartLine { productId: string; quantity: number }

export async function quoteOrder(body: { items: CartLine[]; zoneId: string; promoCode?: string | null }): Promise<Quote> {
  return (await api<{ quote: Quote }>("/api/orders/quote", { method: "POST", body: JSON.stringify(body) })).quote;
}

export async function placeOrder(body: {
  items: CartLine[];
  zoneId: string;
  promoCode?: string | null;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  paymentMethod: "mpesa" | "till";
  phone?: string;
  notes?: string;
}): Promise<{ orderId: string; total: number }> {
  return api<{ orderId: string; total: number }>("/api/orders/create", { method: "POST", body: JSON.stringify(body) });
}
