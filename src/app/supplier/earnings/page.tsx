"use client";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Download, Phone, Clock, Check, X } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersBySupplier, createPayoutRequest, getPayoutRequestsByUser, tsToDate } from "@/lib/firebase/db";
import type { Order, PayoutRequest } from "@/lib/firebase/db";

const COMMISSION_RATE = 0.1;

const payoutBadge: Record<string, "yellow" | "green" | "red"> = {
  pending: "yellow", paid: "green", rejected: "red",
};
const payoutIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  paid: <Check className="w-3 h-3" />,
  rejected: <X className="w-3 h-3" />,
};

export default function SupplierEarningsPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutPhone, setPayoutPhone] = useState("");
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    getOrdersBySupplier(uid)
      .then((all) => setOrders(all.filter((o) => o.status === "delivered")))
      .catch(console.error)
      .finally(() => setLoading(false));
    getPayoutRequestsByUser(uid)
      .then(setPayouts)
      .catch(console.error);
  }, [user?.uid]);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const net = (subtotal: number) => Math.round(subtotal * (1 - COMMISSION_RATE));

  const weekNet = orders.filter((o) => tsToDate(o.createdAt) >= weekAgo).reduce((s, o) => s + net(o.subtotal), 0);
  const monthNet = orders.filter((o) => tsToDate(o.createdAt) >= monthAgo).reduce((s, o) => s + net(o.subtotal), 0);
  const totalNet = orders.reduce((s, o) => s + net(o.subtotal), 0);
  const paidOut = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingPayout = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const available = totalNet - paidOut - pendingPayout;

  async function requestPayout() {
    if (!payoutPhone.trim()) return toast.error("Enter your M-Pesa number");
    if (available <= 0) return toast.error("No available balance to withdraw");
    if (!user) return;
    setSubmitting(true);
    try {
      await createPayoutRequest({
        userId: user.uid,
        userName: user.businessName ?? user.name,
        userRole: "supplier",
        phone: payoutPhone.trim(),
        amount: available,
      });
      const updated = await getPayoutRequestsByUser(user.uid);
      setPayouts(updated);
      toast.success("Payout request sent! You will be paid within 24 hours.");
      setPayoutOpen(false);
      setPayoutPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit payout request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Earnings & Payouts</h1>
        {available > 0 && (
          <Button variant="primary" size="sm" onClick={() => setPayoutOpen(true)}>
            <Phone className="w-4 h-4" /> Request Payout
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="This Week (Net)" value={formatKES(weekNet)} icon={<TrendingUp className="w-5 h-5" />} color="teal" />
        <StatCard label="This Month (Net)" value={formatKES(monthNet)} icon={<DollarSign className="w-5 h-5" />} color="orange" />
        <StatCard label="All-Time (Net)" value={formatKES(totalNet)} icon={<DollarSign className="w-5 h-5" />} color="navy" />
        <StatCard label="Available" value={formatKES(available)} icon={<DollarSign className="w-5 h-5" />} color="green" />
      </div>

      <div className="bg-navy-50 rounded-2xl p-4 mb-6 text-sm font-josefin text-gray-600">
        💡 OkoaTime charges a <strong className="text-navy">10% platform commission</strong> on each order.
        Net = Items Amount − Commission. Delivery fee is handled separately.
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-outfit font-bold text-navy mb-4">Payout Requests</h3>
          <div className="space-y-3">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">{formatDate(tsToDate(p.createdAt))}</p>
                  <p className="font-josefin text-gray-600 text-sm">M-Pesa → {p.phone}</p>
                  {p.mpesaRef && <p className="font-josefin text-xs text-teal font-semibold">Ref: {p.mpesaRef}</p>}
                  {p.adminNote && <p className="font-josefin text-xs text-gray-400 italic">{p.adminNote}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-outfit font-bold text-navy">{formatKES(p.amount)}</p>
                  <Badge variant={payoutBadge[p.status]}>
                    <span className="flex items-center gap-1">{payoutIcon[p.status]}{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-outfit font-bold text-navy">Transaction History</h3>
          {orders.length > 0 && (
            <button className="flex items-center gap-1.5 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-3">💰</p>
            <p className="font-outfit font-bold text-navy mb-1">No earnings yet</p>
            <p className="font-josefin text-gray-400 text-sm">Earnings appear here once orders are delivered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Order ID", "Customer", "Items", "Commission", "Net", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const commission = Math.round(o.subtotal * COMMISSION_RATE);
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-josefin text-gray-500 text-xs">{o.id.slice(0, 14)}</td>
                      <td className="py-3 pr-4 font-josefin font-semibold text-navy">{o.customerName}</td>
                      <td className="py-3 pr-4 font-outfit font-semibold text-navy">{formatKES(o.subtotal)}</td>
                      <td className="py-3 pr-4 font-josefin text-red-400">-{formatKES(commission)}</td>
                      <td className="py-3 pr-4 font-outfit font-bold text-green-600">{formatKES(o.subtotal - commission)}</td>
                      <td className="py-3 pr-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(o.createdAt))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setPayoutOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-outfit font-bold text-xl text-navy mb-2">Request Payout</h3>
            <p className="font-josefin text-gray-500 text-sm mb-1">Available balance:</p>
            <p className="font-outfit font-black text-2xl text-green-600 mb-4">{formatKES(available)}</p>
            <div className="mb-4">
              <label className="label">M-Pesa Phone Number</label>
              <input
                className="input-field"
                type="tel"
                placeholder="0712 345 678"
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
              />
            </div>
            <p className="font-josefin text-gray-400 text-xs mb-4">
              Our team will send {formatKES(available)} to this number within 24 hours.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPayoutOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" loading={submitting} onClick={requestPayout}>
                Request {formatKES(available)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
