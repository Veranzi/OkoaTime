"use client";
import { useEffect, useState } from "react";
import { Users, ShoppingBag, DollarSign, Truck, Clock, TrendingUp } from "lucide-react";
import { formatKES, formatRelative } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import GoogleMapComponent from "@/components/ui/GoogleMap";
import type { MapMarker } from "@/components/ui/GoogleMap";
import { getAllUsers, getAllOrders, getAllPayments, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";
import type { UserProfile } from "@/lib/firebase/auth";

const LIVE_RIDERS: MapMarker[] = [
  { position: { lat: -2.2720, lng: 40.9010 }, label: "Hassan", type: "rider" },
  { position: { lat: -2.2650, lng: 40.9055 }, label: "David", type: "rider" },
  { position: { lat: -2.2580, lng: 40.8980 }, label: "Ali", type: "rider" },
];

const activityBadge: Record<string, "green" | "yellow" | "blue" | "orange" | "red" | "teal" | "gray"> = {
  pending: "yellow", delivered: "green", paid: "teal", active: "green",
  cancelled: "red", confirmed: "blue",
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => {});
    getAllOrders().then(setOrders).catch(() => {});
    getAllPayments()
      .then((p) => setTotalRevenue(p.filter((x) => x.status === "completed").reduce((s, x) => s + x.amount, 0)))
      .catch(() => {});
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((o) => tsToDate(o.createdAt) >= today);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeDeliveries = orders.filter((o) => o.status === "rider_assigned" || o.status === "picked_up");
  const completedToday = todaysOrders.filter((o) => o.status === "delivered");
  const todaysRevenue = todaysOrders.reduce((s, o) => s + o.total, 0);

  const customers = users.filter((u) => u.role === "customer");
  const suppliers = users.filter((u) => u.role === "supplier" && u.status === "active");
  const riders = users.filter((u) => u.role === "rider");
  const boats = users.filter((u) => u.role === "boat");

  const stats = [
    { label: "Total Users", value: users.length.toString(), icon: <Users className="w-5 h-5" />, color: "navy" as const },
    { label: "Orders Today", value: todaysOrders.length.toString(), icon: <ShoppingBag className="w-5 h-5" />, color: "orange" as const },
    { label: "Revenue Today", value: formatKES(todaysRevenue || totalRevenue), icon: <DollarSign className="w-5 h-5" />, color: "teal" as const },
    { label: "Pending Orders", value: pendingOrders.length.toString(), icon: <Truck className="w-5 h-5" />, color: "green" as const },
  ];

  const recentOrders = orders.slice(0, 6).map((o) => ({
    type: "order" as const,
    message: `Order by ${o.customerName} — ${o.items.map((i) => i.name).join(", ")}`,
    time: tsToDate(o.createdAt),
    status: o.status,
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="page-header">Admin Dashboard</h1>
        <p className="font-josefin text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit font-bold text-navy">Live Orders Map</h3>
            <Badge variant="green" className="animate-pulse">● Live</Badge>
          </div>
          <GoogleMapComponent markers={LIVE_RIDERS} height="h-56" zoom={14} className="w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-center text-sm">
            {[
              { icon: <Truck className="w-4 h-4" />, label: "Active Deliveries", value: activeDeliveries.length.toString() },
              { icon: <Clock className="w-4 h-4" />, label: "Pending Orders", value: pendingOrders.length.toString() },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Completed Today", value: completedToday.length.toString() },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-center text-teal mb-1">{item.icon}</div>
                <p className="font-outfit font-bold text-navy">{item.value}</p>
                <p className="font-josefin text-gray-400 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-outfit font-bold text-navy mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="font-josefin text-gray-400 text-sm text-center py-4">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <span className="text-lg flex-shrink-0">🛒</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-josefin text-navy text-xs leading-relaxed truncate">{item.message}</p>
                    <p className="font-josefin text-gray-400 text-xs mt-0.5">{formatRelative(item.time)}</p>
                  </div>
                  <Badge variant={activityBadge[item.status] ?? "gray"} className="flex-shrink-0 text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { emoji: "👥", label: "Customers", value: customers.length.toString(), sub: "registered" },
          { emoji: "🏪", label: "Suppliers", value: suppliers.length.toString(), sub: "approved" },
          { emoji: "🛵", label: "Riders", value: riders.length.toString(), sub: "registered" },
          { emoji: "⛵", label: "Boat Operators", value: boats.length.toString(), sub: "registered" },
        ].map((m) => (
          <div key={m.label} className="card text-center">
            <div className="text-3xl mb-2">{m.emoji}</div>
            <p className="font-outfit font-black text-navy text-2xl">{m.value}</p>
            <p className="font-outfit font-semibold text-gray-500 text-sm">{m.label}</p>
            <p className="font-josefin text-gray-400 text-xs">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
