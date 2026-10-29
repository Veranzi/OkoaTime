import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { PlatformRates } from "@/lib/utils";
import {
  computeQuote,
  isOfferLive,
  normalizePromoCode,
  resolveEffectiveRates,
  userOverrideField,
  ROLE_RATE_FIELDS,
  type CustomerDiscountOffer,
  type DeliveryZone,
  type EffectiveRates,
  type PartnerRole,
  type PricingSettings,
  type Quote,
} from "@/lib/pricing";
import { PaymentError } from "@/payments/utils/errors.util";
import {
  getPricingSettings,
  getUserDoc,
  listActiveOffers,
  listUsersByRole,
  offerFromDoc,
  savePricingSettings,
  setUserOverrides,
} from "./pricing.repository";
import type { CartInput, CreateOrderInput, PartnerRatesInput } from "./pricing.validators";

const PARTNER_ROLES: PartnerRole[] = ["supplier", "rider", "boat"];

// The rate fields of the settings, without the delivery zones.
function ratesOf(s: PricingSettings): PlatformRates {
  return {
    commissionRate: s.commissionRate,
    riderShare: s.riderShare,
    riderShareHandoff: s.riderShareHandoff,
    boatShare: s.boatShare,
    boatShareHandoff: s.boatShareHandoff,
  };
}

function asPartnerRole(role: unknown): PartnerRole | null {
  return PARTNER_ROLES.includes(role as PartnerRole) ? (role as PartnerRole) : null;
}

// ── Partner rates ──────────────────────────────────────────────────────────

export async function getMyRates(uid: string): Promise<EffectiveRates & { role: string | null; defaults: PlatformRates }> {
  const [settings, user, offers] = await Promise.all([
    getPricingSettings(),
    getUserDoc(uid),
    listActiveOffers("partner_rate"),
  ]);
  const role = asPartnerRole(user?.role);
  const defaults = ratesOf(settings);
  return {
    role: (user?.role as string) ?? null,
    defaults,
    ...resolveEffectiveRates(defaults, role, uid, user ?? {}, offers),
  };
}

export interface PartnerRow extends EffectiveRates {
  uid: string;
  name: string;
  displayName: string;
  status: string;
}

export async function listPartners(role: PartnerRole): Promise<PartnerRow[]> {
  const [settings, users, offers] = await Promise.all([
    getPricingSettings(),
    listUsersByRole(role),
    listActiveOffers("partner_rate"),
  ]);
  const defaults = ratesOf(settings);
  return users
    .map(({ uid, data }) => ({
      uid,
      name: String(data.name ?? ""),
      displayName: String(data.businessName ?? data.boatName ?? data.name ?? ""),
      status: String(data.status ?? ""),
      ...resolveEffectiveRates(defaults, role, uid, data, offers),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function applyPartnerRates(input: PartnerRatesInput, adminUid: string): Promise<{ updated: number }> {
  const fields = ROLE_RATE_FIELDS[input.role];
  const rates = input.rates ?? {};

  if (input.action === "set" && !fields.some((f) => typeof rates[f] === "number")) {
    throw new PaymentError("Enter at least one rate to apply.", 400);
  }

  let uids: string[];
  if (input.target === "selected") {
    uids = Array.from(new Set(input.uids ?? []));
    if (uids.length === 0) throw new PaymentError("Select at least one partner.", 400);
    // Only ever touch users who really have this role.
    const roleUids = new Set((await listUsersByRole(input.role)).map((u) => u.uid));
    if (uids.some((u) => !roleUids.has(u))) throw new PaymentError("Some selected users don't have this role.", 400);
  } else {
    uids = (await listUsersByRole(input.role)).map((u) => u.uid);
  }

  if (input.action === "set" && input.target === "all") {
    // "Everyone" changes the default; partners with their own rate keep it
    // unless admin also asks to clear individual rates.
    const patch: Partial<PlatformRates> = {};
    for (const f of fields) if (typeof rates[f] === "number") patch[f] = rates[f];
    if (input.role === "rider" || input.role === "boat") {
      const current = await getPricingSettings();
      const merged = { ...current, ...patch };
      if (merged.riderShareHandoff + merged.boatShareHandoff > 100) {
        throw new PaymentError("Rider + boat shares on a bike + boat delivery can't add up to more than 100%.", 400);
      }
    }
    await savePricingSettings(patch, adminUid);
    if (input.clearOverrides) {
      await setUserOverrides(uids, Object.fromEntries(fields.map((f) => [userOverrideField(f), null])));
    }
    return { updated: uids.length };
  }

  if (input.action === "reset") {
    await setUserOverrides(uids, Object.fromEntries(fields.map((f) => [userOverrideField(f), null])));
    return { updated: uids.length };
  }

  const overrideFields: Record<string, number> = {};
  for (const f of fields) if (typeof rates[f] === "number") overrideFields[userOverrideField(f)] = rates[f]!;
  await setUserOverrides(uids, overrideFields);
  return { updated: uids.length };
}

// ── Checkout pricing ───────────────────────────────────────────────────────

interface PricedCart {
  quote: Quote;
  zone: DeliveryZone;
  items: { productId: string; name: string; quantity: number; price: number; unit?: string; supplierId: string; supplierName: string; category: string }[];
}

async function priceCart(uid: string, input: CartInput): Promise<PricedCart> {
  const settings = await getPricingSettings();
  const zone = settings.deliveryZones.find((z) => z.id === input.zoneId && z.active);
  if (!zone) throw new PaymentError("That delivery area isn't available. Please choose another.", 400);

  // Real prices come from the product records — never from the browser.
  const productRefs = input.items.map((i) => adminDb.collection("products").doc(i.productId));
  const snaps = await adminDb.getAll(...productRefs);
  const items = input.items.map((line, idx) => {
    const snap = snaps[idx];
    const p = snap.exists ? (snap.data() as Record<string, unknown>) : null;
    if (!p || p.available === false || typeof p.price !== "number" || p.price <= 0) {
      throw new PaymentError(`An item in your cart is no longer available. Please review your cart.`, 409);
    }
    return {
      productId: line.productId,
      name: String(p.name ?? ""),
      quantity: line.quantity,
      price: p.price,
      ...(p.unit ? { unit: String(p.unit) } : {}),
      supplierId: String(p.supplierId ?? ""),
      supplierName: String(p.supplierName ?? ""),
      category: String(p.category ?? ""),
    };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const code = input.promoCode ? normalizePromoCode(input.promoCode) : null;
  const live = (await listActiveOffers("customer_discount"))
    .filter((o): o is CustomerDiscountOffer => o.kind === "customer_discount" && isOfferLive(o))
    .filter((o) => o.code === null || o.code === code);

  // One-per-customer offers this customer has already used.
  let promoBlockedReason: string | null = null;
  const usable: CustomerDiscountOffer[] = [];
  for (const offer of live) {
    if (offer.onePerCustomer) {
      const used = await adminDb.collection("offers").doc(offer.id).collection("redemptions").doc(uid).get();
      if (used.exists) {
        if (offer.code) promoBlockedReason = "You've already used this promo code.";
        continue;
      }
    }
    usable.push(offer);
  }

  const quote = computeQuote({ subtotal, zone, offers: usable, promoCode: code, promoBlockedReason });
  return { quote, zone, items };
}

export async function quoteCart(uid: string, input: CartInput): Promise<Quote & { zoneId: string }> {
  const { quote, zone } = await priceCart(uid, input);
  return { ...quote, zoneId: zone.id };
}

/** Prices the cart on the server and writes the order. Returns the new order id. */
export async function createPricedOrder(uid: string, input: CreateOrderInput): Promise<{ orderId: string; total: number }> {
  const customer = await getUserDoc(uid);
  if (!customer) throw new PaymentError("Your account could not be found. Please sign in again.", 401);

  const { quote, zone, items } = await priceCart(uid, input);
  if (input.promoCode && quote.promoError) throw new PaymentError(quote.promoError, 400);

  const supplierIds = Array.from(new Set(items.map((i) => i.supplierId).filter(Boolean)));
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
  const singleSupplier = supplierIds.length === 1 ? items.find((i) => i.supplierId === supplierIds[0])! : null;

  // Lock in the supplier's commission at order time when there is exactly one
  // supplier; later rate changes then never alter this order's earnings.
  let commissionRate: number | null = null;
  if (singleSupplier) {
    const [settings, supplierDoc, partnerOffers] = await Promise.all([
      getPricingSettings(),
      getUserDoc(singleSupplier.supplierId),
      listActiveOffers("partner_rate"),
    ]);
    const defaults = ratesOf(settings);
    commissionRate = resolveEffectiveRates(defaults, "supplier", singleSupplier.supplierId, supplierDoc ?? {}, partnerOffers)
      .rates.commissionRate;
  }

  const orderRef = adminDb.collection("orders").doc();
  const order = {
    customerId: uid,
    customerName: String(customer.name ?? ""),
    customerPhone: String(customer.phone ?? ""),
    category: categories.length === 1 ? categories[0] : "mixed",
    categories,
    items: items.map(({ productId, name, quantity, price, unit }) => ({ productId, name, quantity, price, ...(unit ? { unit } : {}) })),
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    deliveryZoneId: zone.id,
    deliveryType: zone.type,
    deliveryDiscount: quote.deliveryDiscount,
    orderDiscount: quote.orderDiscount,
    discountTotal: quote.discountTotal,
    appliedOffers: quote.applied,
    ...(quote.applied.some((a) => a.code) ? { promoCode: quote.applied.find((a) => a.code)!.code } : {}),
    total: quote.total,
    deliveryAddress: input.deliveryAddress,
    ...(input.deliveryLat !== undefined ? { deliveryLat: input.deliveryLat } : {}),
    ...(input.deliveryLng !== undefined ? { deliveryLng: input.deliveryLng } : {}),
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending",
    status: "pending",
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    ...(singleSupplier ? { supplierId: singleSupplier.supplierId, supplierName: singleSupplier.supplierName } : {}),
    ...(commissionRate !== null ? { commissionRate } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Usage limits are re-checked inside the transaction so two customers
  // can't both take the last use of an offer.
  await adminDb.runTransaction(async (tx) => {
    const offerRefs = quote.applied.map((a) => adminDb.collection("offers").doc(a.offerId));
    const offerSnaps = offerRefs.length ? await tx.getAll(...offerRefs) : [];
    const redemptionRefs = offerRefs.map((r) => r.collection("redemptions").doc(uid));
    const redemptionSnaps = redemptionRefs.length ? await tx.getAll(...redemptionRefs) : [];

    offerSnaps.forEach((snap, i) => {
      const offer = snap.exists ? offerFromDoc(snap.id, snap.data()!) : null;
      if (!offer || offer.kind !== "customer_discount" || !isOfferLive(offer)) {
        throw new PaymentError("An offer on your order just ended. Please review your order and try again.", 409);
      }
      if (offer.onePerCustomer && redemptionSnaps[i].exists) {
        throw new PaymentError("You've already used this offer.", 409);
      }
    });

    tx.set(orderRef, order);
    offerRefs.forEach((ref, i) => {
      tx.update(ref, { usedCount: FieldValue.increment(1) });
      tx.set(redemptionRefs[i], { orderId: orderRef.id, amount: quote.applied[i].amount, at: FieldValue.serverTimestamp() });
    });
  });

  return { orderId: orderRef.id, total: quote.total };
}

export { getPricingSettings, savePricingSettings };
