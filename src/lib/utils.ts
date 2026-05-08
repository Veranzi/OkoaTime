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
  { id: "seafood", label: "Seafood", icon: "🐟", description: "Fresh fish, prawns, crabs & more" },
  { id: "groceries", label: "House Shopping", icon: "🛒", description: "Groceries & household needs" },
  { id: "fruits_veg", label: "Fruits & Vegetables", icon: "🥦", description: "Fresh produce daily" },
  { id: "household", label: "Household Items", icon: "🏠", description: "Cleaning, supplies & more" },
  { id: "boat", label: "Boat Transport", icon: "⛵", description: "Lamu · Shela · Manda routes" },
];

export function generateOrderId(): string {
  const prefix = "OT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
