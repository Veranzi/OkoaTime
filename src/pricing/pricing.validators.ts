import { z } from "zod";

const pct = z.number().min(0).max(100);
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date").nullable().optional();

export const RatesPatchSchema = z.object({
  commissionRate: pct.optional(),
  riderShare: pct.optional(),
  riderShareHandoff: pct.optional(),
  boatShare: pct.optional(),
  boatShareHandoff: pct.optional(),
});

export const DeliveryZoneSchema = z.object({
  id: z.string().min(1).max(40).regex(/^[a-z0-9_]+$/, "Zone id: lowercase letters, numbers and _ only"),
  label: z.string().min(1).max(60),
  desc: z.string().max(120),
  type: z.enum(["bike", "boat", "bike_to_boat"]),
  fee: z.number().int().min(0).max(100000),
  active: z.boolean(),
});

export const SettingsSchema = RatesPatchSchema.extend({
  deliveryZones: z.array(DeliveryZoneSchema).min(1).max(50).optional(),
}).refine(
  (s) => s.riderShareHandoff === undefined || s.boatShareHandoff === undefined || s.riderShareHandoff + s.boatShareHandoff <= 100,
  "Rider + boat shares on a bike + boat delivery can't add up to more than 100%.",
).refine(
  (s) => !s.deliveryZones || new Set(s.deliveryZones.map((z) => z.id)).size === s.deliveryZones.length,
  "Each delivery zone needs a unique id.",
);

export const PartnerRatesSchema = z.object({
  role: z.enum(["supplier", "rider", "boat"]),
  target: z.enum(["all", "selected"]),
  uids: z.array(z.string().min(1)).max(2000).optional(),
  action: z.enum(["set", "reset"]),
  rates: RatesPatchSchema.optional(),
  clearOverrides: z.boolean().optional(),
});

const offerBase = {
  name: z.string().min(1).max(80),
  active: z.boolean(),
  startsAt: isoDate,
  endsAt: isoDate,
};

export const PartnerRateOfferSchema = z.object({
  kind: z.literal("partner_rate"),
  ...offerBase,
  role: z.enum(["supplier", "rider", "boat"]),
  targetIds: z.array(z.string().min(1)).max(2000).nullable(),
  rates: RatesPatchSchema,
});

export const CustomerDiscountOfferSchema = z.object({
  kind: z.literal("customer_discount"),
  ...offerBase,
  appliesTo: z.enum(["delivery", "order"]),
  discountType: z.enum(["percent", "amount"]),
  value: z.number().positive().max(1000000),
  zoneIds: z.array(z.string().min(1)).nullable(),
  minSubtotal: z.number().min(0).nullable(),
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, "Codes: letters, numbers, - and _ only").nullable(),
  maxUses: z.number().int().positive().nullable(),
  onePerCustomer: z.boolean(),
}).refine((o) => o.discountType !== "percent" || o.value <= 100, "A percentage discount can't be more than 100%.");

export const OfferSchema = z.discriminatedUnion("kind", [PartnerRateOfferSchema, CustomerDiscountOfferSchema]);

export const OfferPatchSchema = z.object({ active: z.boolean() });

export const CartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(999),
  })).min(1).max(100),
  zoneId: z.string().min(1),
  promoCode: z.string().trim().max(30).nullable().optional(),
});

export const CreateOrderSchema = CartSchema.extend({
  deliveryAddress: z.string().trim().min(1).max(500),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  paymentMethod: z.enum(["mpesa", "till"]),
  phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CartInput = z.infer<typeof CartSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type PartnerRatesInput = z.infer<typeof PartnerRatesSchema>;
