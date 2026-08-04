"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, DollarSign, TrendingUp, RefreshCw, Banknote, Smartphone, Search, RotateCw } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getAllOrders, tsToDate } from "@/lib/firebase/db";
import type { Order, Payment, PaymentStatus } from "@/lib/firebase/db";
import { auth } from "@/lib/firebase/config";
import { useAuthStore } from "@/lib/store/useAuthStore";

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, "green" | "yellow" | "red" | "orange" | "gray"> = {
  INITIATED: "gray",
  PENDING: "yellow",
  COMPLETED: "green",
  FAILED: "red",
  TIMEOUT: "orange",
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ITEM_COMM = 0.1;
const DELIVERY_COMM = 0.3;

// A "payment" is any order that has been delivered or has paymentStatus=paid
function isPaid(o: Order) {
  return o.status === "delivered" || o.paymentStatus === "paid";
}

export default function AdminPaymentsPage() {
  const { loading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setOrders(await getAllOrders()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // ── Real M-Pesa payment records (Payments module) ──────────────────────
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  function buildFilterParams() {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate).toISOString());
    return params;
  }

  async function loadPayments() {
    setPaymentsLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/payments/admin/list?${buildFilterParams().toString()}`, { headers });
      const data = (await res.json()) as { success: boolean; payments?: Payment[]; message?: string };
      if (data.success && data.payments) {
        setPayments(data.payments);
      } else {
        toast.error(data.message ?? "Failed to load payment records");
      }
    } catch {
      toast.error("Network error loading payment records");
    } finally {
      setPaymentsLoading(false);
    }
  }

  // Wait for Firebase Auth to finish restoring the session before firing the
  // first request — auth.currentUser is null for a brief moment on page
  // load, which would otherwise send this with no Authorization header.
  useEffect(() => {
    if (authLoading) return;
    loadPayments();
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExportCsv() {
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/payments/admin/export?${buildFilterParams().toString()}`, { headers });
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "okoatime-payments.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

  async function handleRetryQuery(paymentId: string) {
    setRetryingId(paymentId);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/payments/mpesa/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await res.json()) as { success: boolean; message?: string };
      if (data.success) {
        toast.success("Status refreshed from Safaricom");
        loadPayments();
      } else {
        toast.error(data.message ?? "Retry failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRetryingId(null);
    }
  }

  const paid = orders.filter(isPaid);
  const mpesa = paid.filter((o) => o.paymentMethod === "mpesa");
  const till  = paid.filter((o) => o.paymentMethod === "till");

  const totalRevenue    = paid.reduce((s, o) => s + o.total, 0);
  const totalItemComm   = paid.reduce((s, o) => s + Math.round(o.subtotal * ITEM_COMM), 0);
  const totalDelComm    = paid.reduce((s, o) => s + Math.round((o.deliveryFee ?? 0) * DELIVERY_COMM), 0);
  const totalOkoa       = totalItemComm + totalDelComm;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Payments & Commissions</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{paid.length} completed payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-teal" />
            <p className="font-josefin text-xs text-gray-400">Total Collected</p>
          </div>
          <p className="font-outfit font-black text-2xl text-navy">{formatKES(totalRevenue)}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">{paid.length} orders</p>
        </div>
        <div className="card p-4 bg-navy">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange" />
            <p className="font-josefin text-xs text-gray-300">OkoaTime Revenue</p>
          </div>
          <p className="font-outfit font-black text-2xl text-orange">{formatKES(totalOkoa)}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">Items {formatKES(totalItemComm)} + Delivery {formatKES(totalDelComm)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-green-500" />
            <p className="font-josefin text-xs text-gray-400">M-Pesa</p>
          </div>
          <p className="font-outfit font-black text-2xl text-navy">{formatKES(mpesa.reduce((s, o) => s + o.total, 0))}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">{mpesa.length} orders</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-blue-500" />
            <p className="font-josefin text-xs text-gray-400">Pay via Till</p>
          </div>
          <p className="font-outfit font-black text-2xl text-navy">{formatKES(till.reduce((s, o) => s + o.total, 0))}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">{till.length} orders</p>
        </div>
      </div>

      {/* Transaction log */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-outfit font-bold text-navy">Transaction Log</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" /></div>
        ) : paid.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No payments yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order ID", "Customer", "Supplier", "Method", "Subtotal", "Item Comm (10%)", "Delivery Fee", "Del. Comm (30%)", "OkoaTime", "Total", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paid.map((o) => {
                  const itemComm   = Math.round(o.subtotal * ITEM_COMM);
                  const delComm    = Math.round((o.deliveryFee ?? 0) * DELIVERY_COMM);
                  const okoaTotal  = itemComm + delComm;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 font-josefin text-teal text-xs font-semibold">{o.id.slice(0, 12)}</td>
                      <td className="p-4 font-josefin font-semibold text-navy text-sm whitespace-nowrap">{o.customerName}</td>
                      <td className="p-4 font-josefin text-gray-500 text-xs whitespace-nowrap">{o.supplierName ?? "—"}</td>
                      <td className="p-4">
                        <Badge variant={o.paymentMethod === "mpesa" ? "green" : "blue"}>
                          {o.paymentMethod === "mpesa" ? "M-Pesa" : "Till"}
                        </Badge>
                      </td>
                      <td className="p-4 font-outfit font-semibold text-navy">{formatKES(o.subtotal)}</td>
                      <td className="p-4 font-outfit font-semibold text-orange">+{formatKES(itemComm)}</td>
                      <td className="p-4 font-outfit font-semibold text-gray-500">{formatKES(o.deliveryFee ?? 0)}</td>
                      <td className="p-4 font-outfit font-semibold text-orange">+{formatKES(delComm)}</td>
                      <td className="p-4 font-outfit font-bold text-green-600">{formatKES(okoaTotal)}</td>
                      <td className="p-4 font-outfit font-bold text-navy">{formatKES(o.total)}</td>
                      <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(o.createdAt))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-navy border-t-2 border-navy-700">
                  <td colSpan={4} className="p-4 font-outfit font-bold text-white text-sm">TOTALS — {paid.length} payments</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(paid.reduce((s, o) => s + o.subtotal, 0))}</td>
                  <td className="p-4 font-outfit font-bold text-orange text-sm">+{formatKES(totalItemComm)}</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(paid.reduce((s, o) => s + (o.deliveryFee ?? 0), 0))}</td>
                  <td className="p-4 font-outfit font-bold text-orange text-sm">+{formatKES(totalDelComm)}</td>
                  <td className="p-4 font-outfit font-bold text-green-400 text-sm">{formatKES(totalOkoa)}</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(totalRevenue)}</td>
                  <td className="p-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Real M-Pesa payment records (Payments module) */}
      <div className="card overflow-hidden p-0 mt-6">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-outfit font-bold text-navy">M-Pesa Payment Records</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPayments}
              disabled={paymentsLoading}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${paymentsLoading ? "animate-spin" : ""}`} />
            </button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="input-field pl-9"
                placeholder="Order ID, phone, receipt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") loadPayments(); }}
              />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
            >
              <option value="all">All</option>
              <option value="INITIATED">Initiated</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="TIMEOUT">Timeout</option>
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button variant="secondary" size="sm" onClick={loadPayments} loading={paymentsLoading}>
            Apply Filters
          </Button>
        </div>

        {paymentsLoading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" /></div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No M-Pesa payment attempts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order ID", "Phone", "Amount", "Status", "Receipt", "Result", "Created", ""].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const canRetry = (p.status === "PENDING" || p.status === "FAILED") && !!p.checkoutRequestId;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 font-josefin text-teal text-xs font-semibold whitespace-nowrap">{p.orderId.slice(0, 14)}</td>
                      <td className="p-4 font-josefin text-gray-600 text-sm whitespace-nowrap">{p.phone}</td>
                      <td className="p-4 font-outfit font-semibold text-navy whitespace-nowrap">{formatKES(p.amount)}</td>
                      <td className="p-4"><Badge variant={PAYMENT_STATUS_BADGE[p.status]}>{p.status}</Badge></td>
                      <td className="p-4 font-josefin text-gray-500 text-xs whitespace-nowrap">{p.mpesaReceiptNumber ?? "—"}</td>
                      <td className="p-4 font-josefin text-gray-400 text-xs max-w-[220px] truncate" title={p.resultDesc}>{p.resultDesc ?? "—"}</td>
                      <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(p.createdAt))}</td>
                      <td className="p-4 whitespace-nowrap">
                        {canRetry && (
                          <button
                            onClick={() => handleRetryQuery(p.id)}
                            disabled={retryingId === p.id}
                            className="flex items-center gap-1.5 text-teal font-josefin text-xs font-semibold hover:text-navy transition-colors disabled:opacity-50"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${retryingId === p.id ? "animate-spin" : ""}`} />
                            Retry Status Query
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
