"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Package, MapPin, ChevronRight, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { SERVICE_CATEGORIES, formatKES, formatRelative } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { getOrdersByCustomer, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "ready", "rider_assigned", "picked_up"]);

const statusBadge: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  ready: "teal",
  rider_assigned: "teal",
  picked_up: "orange",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready for Pickup",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    getOrdersByCustomer(user.uid).then(setOrders).catch(() => {});
  }, [user?.uid]);

  const activeOrder = orders.find((o) => ACTIVE_STATUSES.has(o.status));
  const recentOrders = orders.filter((o) => !ACTIVE_STATUSES.has(o.status)).slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div className="bg-hero-gradient rounded-2xl p-6 text-white">
        <p className="font-josefin text-white/70 text-sm mb-1">Welcome back 👋</p>
        <h1 className="font-outfit font-bold text-2xl text-white mb-3">
          {user?.name?.split(" ")[0] ?? "Customer"}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/order/new">
            <Button variant="primary" size="sm">
              <ShoppingBag className="w-4 h-4" /> New Order
            </Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button size="sm" className="bg-white/20 text-white border-white/30 border hover:bg-white/30">
              <Package className="w-4 h-4" /> My Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="bg-orange-50 border border-orange/20 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-3xl flex-shrink-0">🎉</span>
        <div className="flex-1 min-w-0">
          <p className="font-outfit font-bold text-orange text-sm">First Order Free Delivery!</p>
          <p className="font-josefin text-gray-600 text-xs">Use code <strong>FIRST</strong> on your first order and enjoy free delivery.</p>
        </div>
        <Link href="/dashboard/order/new" className="flex-shrink-0">
          <Button size="sm" variant="primary">Order Now</Button>
        </Link>
      </div>

      {/* Active Order */}
      {activeOrder && (
        <div>
          <h2 className="font-outfit font-bold text-lg text-navy mb-3">Active Order</h2>
          <div className="card border-l-4 border-l-teal">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-josefin text-gray-500 text-xs mb-1">Order #{activeOrder.id.slice(0, 12)}</p>
                <p className="font-josefin font-semibold text-navy text-sm">
                  {activeOrder.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </p>
              </div>
              <Badge variant={statusBadge[activeOrder.status] ?? "gray"}>
                {statusLabel[activeOrder.status] ?? activeOrder.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {activeOrder.riderName && (
                <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                  <span>🛵</span> {activeOrder.riderName}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                <Clock className="w-3.5 h-3.5" /> {formatRelative(tsToDate(activeOrder.createdAt))}
              </div>
              <div className="font-outfit font-bold text-navy sm:ml-auto">
                {formatKES(activeOrder.total)}
              </div>
            </div>
            {(activeOrder.status === "rider_assigned" || activeOrder.status === "picked_up") && (
              <Link href={`/dashboard/track/${activeOrder.id}`} className="block mt-4">
                <Button variant="teal" size="sm" className="w-full">
                  <MapPin className="w-4 h-4" /> Track Live
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Order by Category */}
      <div>
        <h2 className="font-outfit font-bold text-lg text-navy mb-3">Order by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href="/dashboard/order/new"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange hover:shadow-card transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="font-josefin font-semibold text-navy text-xs text-center">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-outfit font-bold text-lg text-navy">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-teal font-josefin text-sm font-semibold flex items-center gap-1 hover:text-navy transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="card flex items-center justify-between hover:shadow-card-hover">
                <div>
                  <p className="font-josefin text-gray-400 text-xs mb-0.5">{formatRelative(tsToDate(order.createdAt))}</p>
                  <p className="font-josefin font-semibold text-navy text-sm">#{order.id.slice(0, 12)}</p>
                  <p className="font-josefin text-gray-500 text-xs">{order.category}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusBadge[order.status] ?? "gray"}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <p className="font-outfit font-bold text-navy text-sm">{formatKES(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
