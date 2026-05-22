"use client";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Download, Phone } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersBySupplier, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const COMMISSION_RATE = 0.1;

export default function SupplierEarningsPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutPhone, setPayoutPhone] = useState("");
  const [payoutOpen, setPayoutOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getOrdersBySupplier(user.uid)
      .then((all) => setOrders(all.filter((o) => o.status === "delivered")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const thisWeekOrders = orders.filter((o) => tsToDate(o.createdAt) >= weekAgo);
  const thisMonthOrders = orders.filter((o) => tsToDate(o.createdAt) >= monthAgo);

  const net = (amount: number) => Math.round(amount * (1 - COMMISSION_RATE));

  const weekNet = thisWeekOrders.reduce((s, o) => s + net(o.subtotal), 0);
  const monthNet = thisMonthOrders.reduce((s, o) => s + net(o.subtotal), 0);
  const totalNet = orders.reduce((s, o) => s + net(o.subtotal), 0);

  async function requestPayout() {
    if (!payoutPhone) return toast.error("Enter your M-Pesa number");
    toast.success("Payout request submitted! Expect payment within 24 hours.");
    setPayoutOpen(false);
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Earnings & Payouts</h1>
        {totalNet > 0 && (
          <Button variant="primary" size="sm" onClick={() => setPayoutOpen(true)}>
            <Phone className="w-4 h-4" /> Request Payout
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="This Week (Net)"
          value={formatKES(weekNet)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="teal"
        />
        <StatCard
          label="This Month (Net)"
          value={formatKES(monthNet)}
          icon={<DollarSign className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          label="All-Time (Net)"
          value={formatKES(totalNet)}
          icon={<DollarSign className="w-5 h-5" />}
          color="navy"
        />
      </div>

      <div className="bg-navy-50 rounded-2xl p-4 mb-6 text-sm font-josefin text-gray-600">
        💡 OkoaTime charges a <strong className="text-navy">10% platform commission</strong> on each order.
        Net earnings = Order Amount - Commission.
      </div>

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
            <p className="font-josefin text-gray-400 text-sm">Earnings will appear here once orders are delivered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Order ID</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Customer</th>
                  <th className="text-right font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Amount</th>
                  <th className="text-right font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Commission</th>
                  <th className="text-right font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Net</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const commission = Math.round(o.subtotal * COMMISSION_RATE);
                  const netAmount = o.subtotal - commission;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-josefin text-gray-500 text-xs">{o.id.slice(0, 14)}</td>
                      <td className="py-3 pr-4 font-josefin font-semibold text-navy">{o.customerName}</td>
                      <td className="py-3 pr-4 text-right font-outfit font-semibold text-navy">{formatKES(o.subtotal)}</td>
                      <td className="py-3 pr-4 text-right font-josefin text-red-400">-{formatKES(commission)}</td>
                      <td className="py-3 pr-4 text-right font-outfit font-bold text-green-600">{formatKES(netAmount)}</td>
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
            <p className="font-josefin text-gray-500 text-sm mb-4">
              Available balance: <strong className="text-green-600">{formatKES(totalNet)}</strong>
            </p>
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
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPayoutOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={requestPayout}>
                Request {formatKES(totalNet)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
