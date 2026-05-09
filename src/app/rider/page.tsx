"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, DollarSign, Package, Star, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { formatKES, formatRelative } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getOrdersByRider, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

export default function RiderHomePage() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    getOrdersByRider(user.uid).then(setOrders).catch(() => {});
  }, [user?.uid]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((o) => o.status === "delivered" && tsToDate(o.createdAt) >= today);
  const weekOrders = orders.filter((o) => o.status === "delivered");
  const todayEarnings = todaysOrders.reduce((s, o) => s + (o.riderPayout ?? 0), 0);
  const weekEarnings = weekOrders.reduce((s, o) => s + (o.riderPayout ?? 0), 0);
  const activeOrder = orders.find((o) => o.status === "rider_assigned" || o.status === "picked_up");
  const recentDeliveries = weekOrders.slice(0, 3);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-header">Hey, {user?.name?.split(" ")[0] ?? "Rider"} 🛵</h1>
        <p className="font-josefin text-gray-500 text-sm">{new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className={`rounded-3xl p-8 text-center transition-all duration-500 ${isOnline ? "bg-gradient-to-br from-green-400 to-teal" : "bg-gray-100"}`}>
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 transition-all duration-300 ${isOnline ? "bg-white/20 shadow-lg shadow-green-400/30" : "bg-gray-200"}`}>
          <span className="text-4xl">{isOnline ? "🟢" : "🔴"}</span>
        </div>
        <p className={`font-outfit font-black text-2xl mb-2 ${isOnline ? "text-white" : "text-gray-500"}`}>
          {isOnline ? "You're Online" : "You're Offline"}
        </p>
        <p className={`font-josefin text-sm mb-4 ${isOnline ? "text-white/80" : "text-gray-400"}`}>
          {isOnline ? "You can receive delivery orders now" : "Go online to start receiving orders"}
        </p>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-8 py-3 rounded-2xl font-outfit font-bold text-sm transition-all active:scale-95 ${isOnline ? "bg-white text-green-600 hover:bg-green-50" : "bg-navy text-white hover:bg-navy-700"}`}
        >
          {isOnline ? "Go Offline" : "Go Online"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Today's Earnings" value={formatKES(todayEarnings)} icon={<DollarSign className="w-4 h-4" />} color="orange" />
        <StatCard label="This Week" value={formatKES(weekEarnings)} icon={<TrendingUp className="w-4 h-4" />} color="teal" />
        <StatCard label="Deliveries Today" value={todaysOrders.length.toString()} icon={<Package className="w-4 h-4" />} color="navy" />
        <StatCard label="Rating" value="4.8 ⭐" icon={<Star className="w-4 h-4" />} color="green" />
      </div>

      {activeOrder && (
        <div className="card border-l-4 border-l-orange">
          <p className="font-josefin text-orange text-xs font-semibold mb-2">ACTIVE DELIVERY</p>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-outfit font-bold text-navy">Order #{activeOrder.id.slice(0, 12)}</p>
              <p className="font-josefin text-gray-500 text-sm">Pick up from {activeOrder.supplierName ?? "supplier"}</p>
              <p className="font-josefin text-gray-500 text-sm">Deliver to: {activeOrder.deliveryAddress}</p>
            </div>
            <Badge variant="orange">In Progress</Badge>
          </div>
          <Link href="/rider/active">
            <button className="w-full bg-orange text-white font-outfit font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors">
              View Active Delivery
            </button>
          </Link>
        </div>
      )}

      {recentDeliveries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-outfit font-bold text-lg text-navy">Delivery History</h2>
            <Link href="/rider/earnings" className="text-teal font-josefin text-sm font-semibold flex items-center gap-1">
              Earnings <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentDeliveries.map((d) => (
              <div key={d.id} className="card flex items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-josefin text-gray-400 text-xs">{formatRelative(tsToDate(d.createdAt))}</p>
                  <p className="font-josefin font-semibold text-navy text-sm truncate">{d.supplierName ?? "Supplier"}</p>
                  <p className="font-josefin text-gray-400 text-xs truncate">{d.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-outfit font-bold text-green-600">{formatKES(d.riderPayout ?? 0)}</p>
                  <Badge variant="green" className="mt-1">Delivered</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
