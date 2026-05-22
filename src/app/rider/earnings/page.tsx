"use client";
import { useEffect, useState } from "react";
import { DollarSign, Package, TrendingUp, Star, Phone, Clock, Check, X } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersByRider, createPayoutRequest, getPayoutRequestsByUser, tsToDate } from "@/lib/firebase/db";
import type { Order, PayoutRequest } from "@/lib/firebase/db";

const payoutBadge: Record<string, "yellow" | "green" | "red"> = {
  pending: "yellow", paid: "green", rejected: "red",
};
const payoutIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  paid: <Check className="w-3 h-3" />,
  rejected: <X className="w-3 h-3" />,
};

export default function RiderEarningsPage() {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutPhone, setPayoutPhone] = useState("");
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    getOrdersByRider(uid)
      .then((orders) => setDeliveries(orders.filter((o) => o.status === "delivered")))
      .catch(console.error)
      .finally(() => setLoading(false));
    getPayoutRequestsByUser(uid)
      .then(setPayouts)
      .catch(console.error);
  }, [user?.uid]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const todayEarnings = deliveries.filter((d) => tsToDate(d.createdAt) >= today).reduce((s, d) => s + (d.riderPayout ?? 0), 0);
  const weekEarnings = deliveries.filter((d) => tsToDate(d.createdAt) >= weekAgo).reduce((s, d) => s + (d.riderPayout ?? 0), 0);
  const totalEarnings = deliveries.reduce((s, d) => s + (d.riderPayout ?? 0), 0);
  const paidOut = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingPayout = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const available = totalEarnings - paidOut - pendingPayout;

  async function requestPayout() {
    if (!payoutPhone.trim()) return toast.error("Enter your M-Pesa number");
    if (available <= 0) return toast.error("No available balance to withdraw");
    if (!user) return;
    setSubmitting(true);
    try {
      await createPayoutRequest({
        userId: user.uid,
        userName: user.name,
        userRole: "rider",
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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">My Earnings</h1>
        {available > 0 && (
          <Button variant="primary" size="sm" onClick={() => setPayoutOpen(true)}>
            <Phone className="w-4 h-4" /> Request Payout
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today" value={formatKES(todayEarnings)} icon={<DollarSign className="w-4 h-4" />} color="orange" />
        <StatCard label="This Week" value={formatKES(weekEarnings)} icon={<TrendingUp className="w-4 h-4" />} color="teal" />
        <StatCard label="Total Earned" value={formatKES(totalEarnings)} icon={<DollarSign className="w-4 h-4" />} color="navy" />
        <StatCard label="Available" value={formatKES(available)} icon={<Package className="w-4 h-4" />} color="green" />
      </div>

      <div className="card mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
          <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
        </div>
        <div>
          <p className="font-outfit font-bold text-navy text-2xl">4.8 / 5.0</p>
          <p className="font-josefin text-gray-500 text-sm">Based on {deliveries.length} deliveries</p>
        </div>
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

      {/* Delivery History */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Delivery History</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : deliveries.length === 0 ? (
          <p className="text-center font-josefin text-gray-400 py-6">No deliveries yet</p>
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">{formatDate(tsToDate(d.createdAt))}</p>
                  <p className="font-josefin font-semibold text-navy text-sm">{d.supplierName ?? "Supplier"}</p>
                  <p className="font-josefin text-gray-400 text-xs">→ {d.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-outfit font-bold text-green-600">{formatKES(d.riderPayout ?? 0)}</p>
                  <Badge variant="green" className="mt-1">Delivered</Badge>
                </div>
              </div>
            ))}
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
              OkoaTime will send {formatKES(available)} to this number within 24 hours.
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
