import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | number): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatRelative(date: Date | number): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPhone(phone: string): string {
  // Normalize Kenyan phone to 07XX or 01XX format
  if (phone.startsWith("+254")) return "0" + phone.slice(4);
  if (phone.startsWith("254")) return "0" + phone.slice(3);
  return phone;
}

export function toMpesaPhone(phone: string): string {
  // Convert to 254XXXXXXXXX for M-Pesa
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+254")) return cleaned.slice(1);
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("254")) return cleaned;
  return "254" + cleaned;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "rider_assigned",
  "picked_up",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  rider_assigned: "bg-teal-100 text-teal-800",
  picked_up: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const SERVICE_CATEGORIES = [
  { id: "seafood", label: "Seafood", description: "Fresh fish, prawns, crabs & more" },
  { id: "groceries", label: "House Shopping", description: "Groceries & household needs" },
  { id: "fruits_veg", label: "Fruits & Vegetables", description: "Fresh produce daily" },
  { id: "household", label: "Household Items", description: "Cleaning, supplies & more" },
  { id: "boat", label: "Boat Transport", description: "Lamu · Shela · Manda routes" },
];

// Categories an actual product can belong to (excludes "boat", which is transport).
// The AI categorizer constrains its top-level pick to these IDs.
export const PRODUCT_CATEGORIES = ["seafood", "groceries", "fruits_veg", "household"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// Seed subcategories per top category. The AI prefers one of these when it fits,
// otherwise it proposes a new concise label. Subcategory is a flexible grouping/
// display field — it is NOT used for supplier/order routing (only `category` is).
export const SUBCATEGORY_SEEDS: Record<ProductCategory, string[]> = {
  seafood: ["fish", "shellfish", "prawns & crabs", "lobster", "octopus & squid", "dried fish"],
  groceries: ["cereals & grains", "flour", "rice", "legumes", "cooking oil", "sugar & salt", "spices", "beverages", "snacks", "canned goods"],
  fruits_veg: ["fruits", "vegetables", "leafy greens", "herbs", "tubers"],
  household: ["powder soaps", "detergents", "cleaning supplies", "toiletries", "paper products", "kitchenware"],
};

// Platform rates, all whole percentages, set by admin in /admin/settings and
// stored in Firestore at settings/platform. These defaults apply until admin
// saves the settings for the first time.
//
// commissionRate: OkoaTime's cut of each order's item subtotal (a supplier's
// own `commission` field overrides it).
// Delivery-fee split: a plain "bike" job or a direct "boat" job pays the
// courier who does the whole leg riderShare/boatShare. A "bike_to_boat"
// handoff splits the fee across both legs instead of paying it twice:
// riderShareHandoff for pickup-to-jetty, boatShareHandoff for jetty-to-client.
// OkoaTime keeps whatever is left of the delivery fee.
export interface PlatformRates {
  commissionRate: number;
  riderShare: number;
  riderShareHandoff: number;
  boatShare: number;
  boatShareHandoff: number;
}

export const DEFAULT_PLATFORM_RATES: PlatformRates = {
  commissionRate: 10,
  riderShare: 70,
  riderShareHandoff: 40,
  boatShare: 70,
  boatShareHandoff: 30,
};

type FeeOrder = { deliveryFee: number; deliveryType?: string };

export function riderPayoutFor(order: FeeOrder, rates: PlatformRates = DEFAULT_PLATFORM_RATES): number {
  const share = order.deliveryType === "bike_to_boat" ? rates.riderShareHandoff : rates.riderShare;
  return Math.round((order.deliveryFee * share) / 100);
}

export function boatPayoutFor(order: FeeOrder, rates: PlatformRates = DEFAULT_PLATFORM_RATES): number {
  const share = order.deliveryType === "bike_to_boat" ? rates.boatShareHandoff : rates.boatShare;
  return Math.round((order.deliveryFee * share) / 100);
}

// Effective item commission (%) for a supplier: their own admin-set rate if
// they have one, otherwise the platform default.
export function supplierCommissionRate(supplier: { commission?: number } | null | undefined, rates: PlatformRates): number {
  return typeof supplier?.commission === "number" ? supplier.commission : rates.commissionRate;
}

// How an order's money splits between supplier, couriers and OkoaTime. Uses
// the commission and payouts recorded on the order when present; otherwise
// estimates them from the given rates. OkoaTime keeps whatever of the
// delivery fee isn't paid to the rider and/or boat operator, and pays for any
// customer discount out of its own share.
export function orderSplit(
  o: {
    subtotal: number; deliveryFee?: number; deliveryType?: string; riderPayout?: number;
    boatOperatorPayout?: number; commissionRate?: number; discountTotal?: number;
  },
  rates: PlatformRates,
  commissionPct: number,
) {
  const itemComm     = Math.round((o.subtotal * (o.commissionRate ?? commissionPct)) / 100);
  const supplierNet  = o.subtotal - itemComm;
  const deliveryFee  = o.deliveryFee ?? 0;
  const fee          = { deliveryFee, deliveryType: o.deliveryType };
  const riderPayout  = o.deliveryType === "boat" ? 0 : (o.riderPayout ?? riderPayoutFor(fee, rates));
  const boatPayout   = o.deliveryType === "boat" || o.deliveryType === "bike_to_boat"
    ? (o.boatOperatorPayout ?? boatPayoutFor(fee, rates))
    : 0;
  const deliveryComm = deliveryFee - riderPayout - boatPayout;
  const discounts    = o.discountTotal ?? 0;
  return { itemComm, supplierNet, deliveryFee, deliveryComm, riderPayout, boatPayout, discounts, okoaRevenue: itemComm + deliveryComm - discounts };
}

export function generateOrderId(): string {
  const prefix = "OT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
