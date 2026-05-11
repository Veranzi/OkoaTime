import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import type { UserProfile } from "./auth";

export function tsToDate(ts: unknown): Date {
  if (!ts) return new Date();
  if (typeof ts === "object" && ts !== null && "toDate" in ts) {
    return (ts as { toDate(): Date }).toDate();
  }
  return new Date(ts as number);
}

function byCreatedAtDesc<T extends { createdAt: unknown }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime());
}

// ── Order ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "ready"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  category: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  notes?: string;
  paymentMethod: "mpesa" | "cash";
  paymentStatus: "pending" | "paid";
  status: OrderStatus;
  supplierId?: string;
  supplierName?: string;
  riderId?: string;
  riderName?: string;
  riderPayout?: number;
  riderLat?: number;
  riderLng?: number;
  createdAt: unknown;
  updatedAt?: unknown;
}

export function listenToOrder(orderId: string, callback: (order: Order | null) => void): () => void {
  return onSnapshot(doc(db, "orders", orderId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Order : null);
  });
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "orders"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { status, ...extra, updatedAt: serverTimestamp() });
}

export async function updateOrder(orderId: string, data: Partial<Omit<Order, "id" | "createdAt">>): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { ...data, updatedAt: serverTimestamp() });
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, "orders"), where("customerId", "==", customerId)));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
}

export async function getOrdersByCategory(category: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, "orders"), where("category", "==", category)));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(collection(db, "orders"));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
}

export async function getPendingOrders(): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, "orders"), where("status", "==", "ready")));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
}

export async function getOrdersByRider(riderId: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, "orders"), where("riderId", "==", riderId)));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
}

// ── Product ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  available: boolean;
  description?: string;
  imageUrl?: string;
  createdAt: unknown;
}

export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, "products"), where("supplierId", "==", supplierId)));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
}

export async function getAvailableProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, "products"), where("available", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

export async function addProduct(data: Omit<Product, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateProduct(productId: string, data: Partial<Omit<Product, "id" | "supplierId" | "createdAt">>): Promise<void> {
  await updateDoc(doc(db, "products", productId), data);
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, "products", productId));
}

// ── User ───────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
}

export async function getUsersByRole(role: string): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", role)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
}

export async function updateUserDoc(uid: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

// ── Payment ────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  checkoutRequestId: string;
  orderId: string;
  phone: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  failureReason?: string;
  createdAt: unknown;
}

export async function getAllPayments(): Promise<Payment[]> {
  const snap = await getDocs(collection(db, "payments"));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment));
}

// ── Booking ────────────────────────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "rejected" | "completed";

export interface Booking {
  id: string;
  boatOperatorId: string;
  customerName: string;
  customerPhone: string;
  route: string;
  datetime: unknown;
  passengers: number;
  amount: number;
  commission: number;
  net: number;
  status: BookingStatus;
  notes?: string;
  createdAt: unknown;
}

export async function getBookingsByBoatOperator(boatOperatorId: string): Promise<Booking[]> {
  const snap = await getDocs(query(collection(db, "bookings"), where("boatOperatorId", "==", boatOperatorId)));
  return byCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  await updateDoc(doc(db, "bookings", bookingId), { status });
}
