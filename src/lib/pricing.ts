// Pricing rules shared by the server (which is the only thing that decides
// what a customer is charged) and the browser (which previews the same
// numbers). Pure functions only — no Firestore access here.

import { DEFAULT_PLATFORM_RATES, type PlatformRates } from "@/lib/utils";
import type { DeliveryType } from "@/lib/firebase/db";

// ── Delivery zones ─────────────────────────────────────────────────────────

export interface DeliveryZone {
  id: string;
  label: string;
  desc: string;
  type: DeliveryType;
  fee: number;
  active: boolean;
}

// Used until admin saves zones in Settings for the first time.
export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: "lamu_town", label: "Lamu Town",    desc: "Main town · Lamu Island",            type: "bike",         fee: 100, active: true },
  { id: "shela",     label: "Shela",        desc: "Shela village & beach · Lamu Island", type: "bike",         fee: 150, active: true },
  { id: "manda",     label: "Manda Island", desc: "Across the channel · bike + boat",    type: "bike_to_boat", fee: 250, active: true },
  { id: "other",     label: "Other Island", desc: "Pate, Siyu or further destinations", type: "boat",         fee: 400, active: true },
];

export interface PricingSettings extends PlatformRates {
  deliveryZones: DeliveryZone[];
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  ...DEFAULT_PLATFORM_RATES,
  deliveryZones: DEFAULT_DELIVERY_ZONES,
};

// ── Partner rates ──────────────────────────────────────────────────────────

export type PartnerRole = "supplier" | "rider" | "boat";

// Which rate fields each partner type has. A supplier's own override is stored
// on their user doc as `commission` (older field name); the rest are stored
// under the same name as the rate.
export const ROLE_RATE_FIELDS: Record<PartnerRole, (keyof PlatformRates)[]> = {
  supplier: ["commissionRate"],
  rider: ["riderShare", "riderShareHandoff"],
  boat: ["boatShare", "boatShareHandoff"],
};

export const RATE_LABELS: Record<keyof PlatformRates, string> = {
  commissionRate: "Commission on items",
  riderShare: "Share of fee — bike delivery",
  riderShareHandoff: "Share of fee — bike + boat (rider leg)",
  boatShare: "Share of fee — boat delivery",
  boatShareHandoff: "Share of fee — bike + boat (boat leg)",
};

export function userOverrideField(field: keyof PlatformRates): string {
  return field === "commissionRate" ? "commission" : field;
}

/** A partner's own admin-set rates, read off their user doc. */
export function userRateOverrides(user: Record<string, unknown>, role: PartnerRole): Partial<PlatformRates> {
  const out: Partial<PlatformRates> = {};
  for (const field of ROLE_RATE_FIELDS[role]) {
    const v = user[userOverrideField(field)];
    if (typeof v === "number") out[field] = v;
  }
  return out;
}

// ── Offers ─────────────────────────────────────────────────────────────────

interface OfferBase {
  id: string;
  name: string;
  active: boolean;
  startsAt?: string | null; // ISO
  endsAt?: string | null;   // ISO
  createdAt?: string | null;
}

/** Time-limited special rates for some or all partners of one type. */
export interface PartnerRateOffer extends OfferBase {
  kind: "partner_rate";
  role: PartnerRole;
  targetIds: string[] | null; // null = everyone in the role
  rates: Partial<PlatformRates>;
}

/** A discount for customers — automatic, or unlocked by a promo code. */
export interface CustomerDiscountOffer extends OfferBase {
  kind: "customer_discount";
  appliesTo: "delivery" | "order";
  discountType: "percent" | "amount";
  value: number;
  zoneIds: string[] | null; // null = every zone
  minSubtotal: number | null;
  code: string | null;      // null = applied automatically
  maxUses: number | null;
  onePerCustomer: boolean;
  usedCount: number;
}

export type Offer = PartnerRateOffer | CustomerDiscountOffer;

export function isOfferLive(offer: Offer, now: Date = new Date()): boolean {
  if (!offer.active) return false;
  if (offer.startsAt && now < new Date(offer.startsAt)) return false;
  if (offer.endsAt && now >= new Date(offer.endsAt)) return false;
  if (offer.kind === "customer_discount" && offer.maxUses != null && offer.usedCount >= offer.maxUses) return false;
  return true;
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function describeDiscount(o: Pick<CustomerDiscountOffer, "appliesTo" | "discountType" | "value">): string {
  const amount = o.discountType === "percent" ? `${o.value}% off` : `KES ${o.value} off`;
  if (o.appliesTo === "delivery") {
    return o.discountType === "percent" && o.value >= 100 ? "Free delivery" : `${amount} delivery`;
  }
  return `${amount} your order`;
}

// ── Effective partner rates ────────────────────────────────────────────────

export interface EffectiveRates {
  rates: PlatformRates;
  overrides: Partial<PlatformRates>;
  promo: { id: string; name: string; endsAt: string | null; rates: Partial<PlatformRates> } | null;
}

/**
 * Rates that apply to one partner right now. Precedence, highest first:
 * a live partner promo aimed at them (newest wins) → their own admin-set
 * rate → the platform default.
 */
export function resolveEffectiveRates(
  defaults: PlatformRates,
  role: PartnerRole | null,
  uid: string,
  user: Record<string, unknown>,
  offers: Offer[],
  now: Date = new Date(),
): EffectiveRates {
  if (!role) return { rates: { ...defaults }, overrides: {}, promo: null };

  const overrides = userRateOverrides(user, role);
  const rates: PlatformRates = { ...defaults, ...overrides };

  const promo = offers
    .filter((o): o is PartnerRateOffer =>
      o.kind === "partner_rate" && o.role === role && isOfferLive(o, now) &&
      (o.targetIds === null || o.targetIds.includes(uid)))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];

  if (promo) {
    for (const field of ROLE_RATE_FIELDS[role]) {
      const v = promo.rates[field];
      if (typeof v === "number") rates[field] = v;
    }
  }

  return {
    rates,
    overrides,
    promo: promo ? { id: promo.id, name: promo.name, endsAt: promo.endsAt ?? null, rates: promo.rates } : null,
  };
}

// ── Order quote ────────────────────────────────────────────────────────────

export interface AppliedDiscount {
  offerId: string;
  name: string;
  appliesTo: "delivery" | "order";
  amount: number;
  code: string | null;
}

export interface Quote {
  subtotal: number;
  deliveryFee: number;
  deliveryDiscount: number;
  orderDiscount: number;
  discountTotal: number;
  total: number;
  applied: AppliedDiscount[];
  /** Set when a promo code was entered but can't be used on this order. */
  promoError: string | null;
}

function discountAmount(offer: CustomerDiscountOffer, base: number): number {
  const raw = offer.discountType === "percent" ? (base * offer.value) / 100 : offer.value;
  return Math.max(0, Math.min(base, Math.round(raw)));
}

function whyNotEligible(offer: CustomerDiscountOffer, zoneId: string, subtotal: number): string | null {
  if (offer.zoneIds && offer.zoneIds.length > 0 && !offer.zoneIds.includes(zoneId)) {
    return "This code isn't valid for your delivery area.";
  }
  if (offer.minSubtotal != null && subtotal < offer.minSubtotal) {
    return `This code needs an order of at least KES ${offer.minSubtotal}.`;
  }
  return null;
}

/**
 * Prices an order. At most one delivery discount and one order discount
 * apply — whichever saves the customer the most among the live automatic
 * offers and the promo code. OkoaTime funds discounts: partner earnings are
 * always worked out on the undiscounted subtotal and delivery fee.
 * The total never drops below KES 1, the M-Pesa minimum.
 */
export function computeQuote(params: {
  subtotal: number;
  zone: DeliveryZone;
  offers: CustomerDiscountOffer[]; // already live; automatic ones + the one matching the code
  promoCode: string | null;
  promoBlockedReason?: string | null; // e.g. "already used" — decided by the caller
}): Quote {
  const { subtotal, zone, offers } = params;
  const deliveryFee = zone.fee;
  const code = params.promoCode ? normalizePromoCode(params.promoCode) : null;
  let promoError: string | null = params.promoBlockedReason ?? null;

  const candidates: { offer: CustomerDiscountOffer; amount: number }[] = [];
  let codeMatched = false;
  for (const offer of offers) {
    const isCode = offer.code !== null;
    if (isCode) {
      if (!code || offer.code !== code) continue;
      codeMatched = true;
      if (promoError) continue;
      const reason = whyNotEligible(offer, zone.id, subtotal);
      if (reason) { promoError = reason; continue; }
    } else if (whyNotEligible(offer, zone.id, subtotal)) {
      continue;
    }
    const base = offer.appliesTo === "delivery" ? deliveryFee : subtotal;
    const amount = discountAmount(offer, base);
    if (amount > 0) candidates.push({ offer, amount });
  }
  if (code && !codeMatched && !promoError) promoError = "That promo code isn't valid or has expired.";

  const best = (target: "delivery" | "order") =>
    candidates.filter((c) => c.offer.appliesTo === target).sort((a, b) => b.amount - a.amount)[0];
  const bestDelivery = best("delivery");
  const bestOrder = best("order");

  let deliveryDiscount = bestDelivery?.amount ?? 0;
  let orderDiscount = bestOrder?.amount ?? 0;

  // Keep the total at or above KES 1.
  const maxDiscount = Math.max(0, subtotal + deliveryFee - 1);
  if (deliveryDiscount + orderDiscount > maxDiscount) {
    orderDiscount = Math.max(0, Math.min(orderDiscount, maxDiscount - deliveryDiscount));
    deliveryDiscount = Math.min(deliveryDiscount, maxDiscount - orderDiscount);
  }

  const applied: AppliedDiscount[] = [];
  if (bestDelivery && deliveryDiscount > 0) {
    applied.push({ offerId: bestDelivery.offer.id, name: bestDelivery.offer.name, appliesTo: "delivery", amount: deliveryDiscount, code: bestDelivery.offer.code });
  }
  if (bestOrder && orderDiscount > 0) {
    applied.push({ offerId: bestOrder.offer.id, name: bestOrder.offer.name, appliesTo: "order", amount: orderDiscount, code: bestOrder.offer.code });
  }

  if (code && codeMatched && !promoError && !applied.some((a) => a.code === code)) {
    promoError = "You're already getting a better offer on this order.";
  }

  const discountTotal = deliveryDiscount + orderDiscount;
  return {
    subtotal,
    deliveryFee,
    deliveryDiscount,
    orderDiscount,
    discountTotal,
    total: subtotal + deliveryFee - discountTotal,
    applied,
    promoError,
  };
}
