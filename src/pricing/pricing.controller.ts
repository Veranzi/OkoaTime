import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/payments/middleware/require-auth";
import { requireAdmin } from "@/payments/middleware/require-admin";
import { PaymentError } from "@/payments/utils/errors.util";
import { isOfferLive, type CustomerDiscountOffer } from "@/lib/pricing";
import {
  applyPartnerRates,
  createPricedOrder,
  getMyRates,
  getPricingSettings,
  listPartners,
  quoteCart,
  savePricingSettings,
} from "./pricing.service";
import { createOffer, deleteOffer, getUserDoc, listActiveOffers, listOffers, updateOffer } from "./pricing.repository";
import {
  CartSchema,
  CreateOrderSchema,
  OfferPatchSchema,
  OfferSchema,
  PartnerRatesSchema,
  SettingsSchema,
} from "./pricing.validators";

function errorResponse(err: unknown): NextResponse {
  if (err instanceof PaymentError) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.statusCode });
  }
  console.error("Unhandled pricing error:", err);
  return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
}

function badRequest(issues: { message: string }[]): NextResponse {
  return NextResponse.json({ success: false, message: issues[0]?.message ?? "Invalid request" }, { status: 400 });
}

async function readJson(req: NextRequest): Promise<unknown> {
  try { return await req.json(); } catch { throw new PaymentError("Invalid JSON body", 400); }
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAuth(req);
    const [settings, user] = await Promise.all([getPricingSettings(), getUserDoc(uid)]);
    // Admins see every zone (including switched-off ones) to edit them.
    const zones = user?.role === "admin" ? settings.deliveryZones : settings.deliveryZones.filter((z) => z.active);
    return NextResponse.json({ success: true, settings: { ...settings, deliveryZones: zones } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function putSettings(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAdmin(req);
    const parsed = SettingsSchema.safeParse(await readJson(req));
    if (!parsed.success) return badRequest(parsed.error.issues);
    await savePricingSettings(parsed.data, uid);
    return NextResponse.json({ success: true, settings: await getPricingSettings() });
  } catch (err) {
    return errorResponse(err);
  }
}

// ── Partner rates ──────────────────────────────────────────────────────────

export async function getMyRatesHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAuth(req);
    return NextResponse.json({ success: true, ...(await getMyRates(uid)) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function getPartners(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    const role = req.nextUrl.searchParams.get("role");
    if (role !== "supplier" && role !== "rider" && role !== "boat") {
      throw new PaymentError("role must be supplier, rider or boat", 400);
    }
    return NextResponse.json({ success: true, partners: await listPartners(role) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function postPartnerRates(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAdmin(req);
    const parsed = PartnerRatesSchema.safeParse(await readJson(req));
    if (!parsed.success) return badRequest(parsed.error.issues);
    return NextResponse.json({ success: true, ...(await applyPartnerRates(parsed.data, uid)) });
  } catch (err) {
    return errorResponse(err);
  }
}

// ── Offers ─────────────────────────────────────────────────────────────────

export async function getOffers(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    return NextResponse.json({ success: true, offers: await listOffers() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function postOffer(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAdmin(req);
    const parsed = OfferSchema.safeParse(await readJson(req));
    if (!parsed.success) return badRequest(parsed.error.issues);
    const offer = parsed.data;
    if (offer.kind === "customer_discount" && offer.code) {
      const code = offer.code.toUpperCase();
      const clash = (await listOffers()).some((o) => o.kind === "customer_discount" && o.code === code);
      if (clash) throw new PaymentError(`Promo code ${code} already exists.`, 409);
      offer.code = code;
    }
    if (offer.startsAt && offer.endsAt && new Date(offer.endsAt) <= new Date(offer.startsAt)) {
      throw new PaymentError("The end date must be after the start date.", 400);
    }
    const id = await createOffer(offer as Parameters<typeof createOffer>[0], uid);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function patchOffer(req: NextRequest, id: string): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    const parsed = OfferPatchSchema.safeParse(await readJson(req));
    if (!parsed.success) return badRequest(parsed.error.issues);
    await updateOffer(id, parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function removeOffer(req: NextRequest, id: string): Promise<NextResponse> {
  try {
    await requireAdmin(req);
    await deleteOffer(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Live automatic customer offers, for the banner at checkout. Never exposes promo codes. */
export async function getPublicOffers(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAuth(req);
    const offers = (await listActiveOffers("customer_discount"))
      .filter((o): o is CustomerDiscountOffer => o.kind === "customer_discount" && o.code === null && isOfferLive(o))
      .map(({ id, name, appliesTo, discountType, value, zoneIds, minSubtotal, endsAt }) =>
        ({ id, name, appliesTo, discountType, value, zoneIds, minSubtotal, endsAt }));
    return NextResponse.json({ success: true, offers });
  } catch (err) {
    return errorResponse(err);
  }
}

// ── Checkout ───────────────────────────────────────────────────────────────

export async function postQuote(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAuth(req);
    const parsed = CartSchema.safeParse(await readJson(req));
    if (!parsed.success) return badRequest(parsed.error.issues);
    return NextResponse.json({ success: true, quote: await quoteCart(uid, parsed.data) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function postCreateOrder(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid } = await requireAuth(req);
    const parsed = CreateOrderSchema.safeParse(await readJson(req));
    if (!parsed.success) return badRequest(parsed.error.issues);
    return NextResponse.json({ success: true, ...(await createPricedOrder(uid, parsed.data)) });
  } catch (err) {
    return errorResponse(err);
  }
}
