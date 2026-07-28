export type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT";

export const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = ["COMPLETED", "FAILED", "TIMEOUT"];

export function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.includes(status);
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  phone: string;
  amount: number;
  status: PaymentStatus;
  environment: "sandbox" | "production";
  checkoutRequestId?: string;
  merchantRequestId?: string;
  mpesaReceiptNumber?: string;
  resultCode?: number;
  resultDesc?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export type PaymentTransactionSource =
  | "stkpush_response"
  | "callback"
  | "status_query"
  | "admin_retry";

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  orderId: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  source: PaymentTransactionSource;
  detail?: string;
  createdAt: unknown;
}

export type PaymentAuditLogType =
  | "oauth_token_request"
  | "stkpush_request"
  | "stkpush_response"
  | "callback_received"
  | "callback_rejected"
  | "callback_duplicate"
  | "status_query_request"
  | "status_query_response"
  | "error";

export interface PaymentAuditLog {
  id: string;
  paymentId: string | null;
  orderId: string | null;
  type: PaymentAuditLogType;
  payload: Record<string, unknown>;
  statusCode?: number;
  error?: string;
  createdAt: unknown;
}

export interface PaymentLock {
  paymentId: string;
  status: PaymentStatus;
  expiresAt: number;
  createdAt: unknown;
}

export interface InitiatePaymentResult {
  paymentId: string;
  checkoutRequestId: string | null;
  status: PaymentStatus;
  message: string;
  reused: boolean;
}
