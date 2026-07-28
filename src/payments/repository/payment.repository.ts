import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  isTerminalStatus,
  type Payment,
  type PaymentAuditLog,
  type PaymentAuditLogType,
  type PaymentLock,
  type PaymentStatus,
  type PaymentTransaction,
  type PaymentTransactionSource,
} from "../models/payment.model";

const PAYMENTS = "payments";
const TRANSACTIONS = "paymentTransactions";
const AUDIT_LOGS = "paymentAuditLogs";
const LOCKS = "paymentLocks";

// A payment attempt is considered "active" for this long — matches the
// checkout UI's own 90s countdown for an STK prompt to be answered.
const LOCK_TTL_MS = 90_000;

function paymentsCol() {
  return adminDb.collection(PAYMENTS);
}
function transactionsCol() {
  return adminDb.collection(TRANSACTIONS);
}
function auditLogsCol() {
  return adminDb.collection(AUDIT_LOGS);
}
function locksCol() {
  return adminDb.collection(LOCKS);
}

function toPayment(id: string, data: FirebaseFirestore.DocumentData): Payment {
  return { id, ...data } as Payment;
}

/**
 * Atomically reuses an in-flight payment attempt for this order, or creates a
 * new one. Race-free: the lock doc is point-read and written inside a single
 * Firestore transaction, so two concurrent requests for the same order can
 * never both create a fresh attempt (Firestore serializes point reads inside
 * transactions — unlike a plain query, there's no phantom-read gap).
 */
export async function acquirePaymentAttempt(params: {
  orderId: string;
  customerId: string;
  phone: string;
  amount: number;
  environment: "sandbox" | "production";
}): Promise<{ payment: Payment; reused: boolean }> {
  const { orderId, customerId, phone, amount, environment } = params;

  return adminDb.runTransaction(async (tx) => {
    const lockRef = locksCol().doc(orderId);
    const lockSnap = await tx.get(lockRef);
    const now = Date.now();

    if (lockSnap.exists) {
      const lock = lockSnap.data() as PaymentLock;
      const isFresh = lock.expiresAt > now;
      if (isFresh && !isTerminalStatus(lock.status)) {
        const existingRef = paymentsCol().doc(lock.paymentId);
        const existingSnap = await tx.get(existingRef);
        if (existingSnap.exists) {
          return { payment: toPayment(existingSnap.id, existingSnap.data()!), reused: true };
        }
      }
    }

    const paymentRef = paymentsCol().doc();
    const paymentData = {
      orderId,
      customerId,
      phone,
      amount,
      status: "INITIATED" as PaymentStatus,
      environment,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    tx.set(paymentRef, paymentData);
    tx.set(lockRef, {
      paymentId: paymentRef.id,
      status: "INITIATED" as PaymentStatus,
      expiresAt: now + LOCK_TTL_MS,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { payment: toPayment(paymentRef.id, paymentData), reused: false };
  });
}

export async function recordStkPushOutcome(params: {
  paymentId: string;
  orderId: string;
  status: Extract<PaymentStatus, "PENDING" | "FAILED">;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  resultCode?: number;
  resultDesc?: string;
}): Promise<void> {
  const { paymentId, orderId, status, checkoutRequestId, merchantRequestId, resultCode, resultDesc } = params;

  const batch = adminDb.batch();
  batch.update(paymentsCol().doc(paymentId), {
    status,
    ...(checkoutRequestId ? { checkoutRequestId } : {}),
    ...(merchantRequestId ? { merchantRequestId } : {}),
    ...(resultCode !== undefined ? { resultCode } : {}),
    ...(resultDesc ? { resultDesc } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });
  // Best-effort: don't fail the whole outcome if the lock doc is somehow gone.
  batch.set(locksCol().doc(orderId), { status }, { merge: true });
  await batch.commit();

  await addTransaction({
    paymentId,
    orderId,
    fromStatus: "INITIATED",
    toStatus: status,
    source: "stkpush_response",
  });
}

export async function findPaymentByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | null> {
  const snap = await paymentsCol().where("checkoutRequestId", "==", checkoutRequestId).limit(1).get();
  if (snap.empty) return null;
  return toPayment(snap.docs[0].id, snap.docs[0].data());
}

export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const snap = await paymentsCol().doc(paymentId).get();
  if (!snap.exists) return null;
  return toPayment(snap.id, snap.data()!);
}

/**
 * Applies a terminal (or interim) result to an existing payment, guarded by a
 * transaction that re-reads the current status first. If the payment is
 * already terminal, this is a no-op (duplicate: true) — protects against a
 * callback racing an admin's manual status-query retry.
 */
export async function applyPaymentResult(params: {
  paymentId: string;
  orderId: string;
  toStatus: PaymentStatus;
  source: PaymentTransactionSource;
  mpesaReceiptNumber?: string;
  resultCode?: number;
  resultDesc?: string;
}): Promise<{ applied: boolean; duplicate: boolean; payment: Payment | null; fromStatus: PaymentStatus | null }> {
  const { paymentId, orderId, toStatus, mpesaReceiptNumber, resultCode, resultDesc } = params;

  const result = await adminDb.runTransaction(async (tx) => {
    const ref = paymentsCol().doc(paymentId);
    const snap = await tx.get(ref);
    if (!snap.exists) {
      return { applied: false, duplicate: false, payment: null, fromStatus: null as PaymentStatus | null };
    }
    const current = toPayment(snap.id, snap.data()!);
    if (isTerminalStatus(current.status)) {
      return { applied: false, duplicate: true, payment: current, fromStatus: current.status };
    }

    tx.update(ref, {
      status: toStatus,
      ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
      ...(resultCode !== undefined ? { resultCode } : {}),
      ...(resultDesc ? { resultDesc } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(locksCol().doc(orderId), { status: toStatus }, { merge: true });

    return {
      applied: true,
      duplicate: false,
      payment: { ...current, status: toStatus, mpesaReceiptNumber, resultCode, resultDesc },
      fromStatus: current.status,
    };
  });

  if (result.applied) {
    await addTransaction({
      paymentId,
      orderId,
      fromStatus: result.fromStatus,
      toStatus,
      source: params.source,
    });
  }

  return result;
}

export async function addTransaction(entry: {
  paymentId: string;
  orderId: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  source: PaymentTransactionSource;
  detail?: string;
}): Promise<void> {
  try {
    await transactionsCol().add({ ...entry, createdAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.error("Failed to write paymentTransaction (non-fatal):", err);
  }
}

export async function addAuditLog(entry: {
  paymentId: string | null;
  orderId: string | null;
  type: PaymentAuditLogType;
  payload: Record<string, unknown>;
  statusCode?: number;
  error?: string;
}): Promise<void> {
  try {
    await auditLogsCol().add({ ...entry, createdAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.error("Failed to write paymentAuditLog (non-fatal):", err);
  }
}

export interface ListPaymentsFilters {
  status?: PaymentStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  limitCount?: number;
}

/**
 * Queries by a single field (createdAt range) so no composite Firestore
 * index is required, then filters status/search in memory. Fine at current
 * volume; if this needs to scale further, add a composite index on
 * (status, createdAt) and push the status filter into the query.
 */
export async function listPayments(filters: ListPaymentsFilters = {}): Promise<Payment[]> {
  let query: FirebaseFirestore.Query = paymentsCol().orderBy("createdAt", "desc");

  if (filters.startDate) {
    query = query.where("createdAt", ">=", Timestamp.fromDate(filters.startDate));
  }
  if (filters.endDate) {
    query = query.where("createdAt", "<=", Timestamp.fromDate(filters.endDate));
  }
  query = query.limit(filters.limitCount ?? 500);

  const snap = await query.get();
  let payments = snap.docs.map((d) => toPayment(d.id, d.data()));

  if (filters.status) {
    payments = payments.filter((p) => p.status === filters.status);
  }
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    payments = payments.filter(
      (p) =>
        p.orderId.toLowerCase().includes(needle) ||
        p.phone.toLowerCase().includes(needle) ||
        (p.mpesaReceiptNumber ?? "").toLowerCase().includes(needle) ||
        (p.checkoutRequestId ?? "").toLowerCase().includes(needle)
    );
  }

  return payments;
}

/** Equality-only query (no index needed) for admin reconciliation of stuck attempts. */
export async function findStuckPendingPayments(olderThanMs: number): Promise<Payment[]> {
  const snap = await paymentsCol().where("status", "==", "PENDING").get();
  const cutoff = Date.now() - olderThanMs;
  return snap.docs
    .map((d) => toPayment(d.id, d.data()))
    .filter((p) => {
      const createdAt = p.createdAt as { toMillis?: () => number } | undefined;
      const createdMs = typeof createdAt?.toMillis === "function" ? createdAt.toMillis() : 0;
      return createdMs <= cutoff;
    });
}

export type { Payment, PaymentTransaction, PaymentAuditLog };
