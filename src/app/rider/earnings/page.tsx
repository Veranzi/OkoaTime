"use client";
import { useEffect, useState } from "react";
import { DollarSign, Package, TrendingUp, Star } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersByRider, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

export default function RiderEarningsPage() {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getOrdersByRider(user.uid)
      .then((orders) => setDeliveries(orders.filter((o) => o.status === "delivered")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEarnings = deliveries.filter((d) => tsToDate(d.createdAt) >= today).reduce((s, d) => s + (d.riderPayout ?? 0), 0);
  const weekEarnings = deliveries.reduce((s, d) => s + (d.riderPayout ?? 0), 0);
  const monthEarnings = Math.round(weekEarnings * 4.2);

  return (
    <div className="max-w-3xl">
      <h1 className="page-header mb-6">My Earnings</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today" value={formatKES(todayEarnings)} icon={<DollarSign className="w-4 h-4" />} color="orange" />
        <StatCard label="This Week" value={formatKES(weekEarnings)} icon={<TrendingUp className="w-4 h-4" />} color="teal" />
        <StatCard label="This Month" value={formatKES(monthEarnings)} icon={<DollarSign className="w-4 h-4" />} color="navy" />
        <StatCard label="Deliveries" value={deliveries.length.toString()} icon={<Package className="w-4 h-4" />} color="green" />
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
                <p className="font-outfit font-bold text-green-600">{formatKES(d.riderPayout ?? 0)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
