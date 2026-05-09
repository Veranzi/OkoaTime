"use client";
import { Users, ShoppingBag, DollarSign, Truck, Clock, TrendingUp } from "lucide-react";
import { formatKES, formatRelative } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const stats = [
  { label: "Total Users", value: "247", icon: <Users className="w-5 h-5" />, color: "navy" as const, trend: "+12 this week" },
  { label: "Orders Today", value: "38", icon: <ShoppingBag className="w-5 h-5" />, color: "orange" as const, trend: "+5 from yesterday" },
  { label: "Revenue Today", value: formatKES(42800), icon: <DollarSign className="w-5 h-5" />, color: "teal" as const, trend: "+KES 8,200" },
  { label: "Active Riders", value: "6 / 14", icon: <Truck className="w-5 h-5" />, color: "green" as const },
];

const recentActivity = [
  { type: "order", message: "New order #OT-K3X2P by Fatuma Hassan", time: new Date(Date.now() - 2 * 60000), status: "pending" },
  { type: "user", message: "New supplier registered: Mama Mboga Shela", time: new Date(Date.now() - 8 * 60000), status: "pending" },
  { type: "order", message: "Order #OT-M1Y9Q delivered to Ahmed Bakari", time: new Date(Date.now() - 25 * 60000), status: "delivered" },
  { type: "payment", message: "M-Pesa payment KES 1,580 received for #OT-K3X2P", time: new Date(Date.now() - 30 * 60000), status: "paid" },
  { type: "rider", message: "Hassan Mwangi went online", time: new Date(Date.now() - 45 * 60000), status: "active" },
  { type: "order", message: "Order #OT-P5Z7R cancelled by customer", time: new Date(Date.now() - 2 * 3600000), status: "cancelled" },
];

const activityIcons: Record<string, string> = { order: "🛒", user: "👤", payment: "💰", rider: "🛵" };
const activityBadge: Record<string, "green" | "yellow" | "blue" | "orange" | "red" | "teal" | "gray"> = {
  pending: "yellow",
  delivered: "green",
  paid: "teal",
  active: "green",
  cancelled: "red",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="page-header">Admin Dashboard</h1>
        <p className="font-josefin text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Orders Map */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit font-bold text-navy">Live Orders Map</h3>
            <Badge variant="green" className="animate-pulse">● Live</Badge>
          </div>
          <div className="bg-gradient-to-br from-navy to-teal rounded-2xl h-56 flex items-center justify-center relative overflow-hidden">
            <div className="text-center z-10">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="font-josefin text-white font-semibold text-sm">Google Maps — Live Tracking</p>
              <p className="font-josefin text-white/60 text-xs">All active deliveries in real-time</p>
            </div>
            {/* Mock rider pins */}
            {[
              { top: "25%", left: "30%", label: "🛵 Hassan" },
              { top: "55%", left: "60%", label: "🛵 David" },
              { top: "40%", left: "75%", label: "🛵 Ali" },
            ].map((pin) => (
              <div key={pin.label} className="absolute bg-orange text-white text-xs px-2 py-0.5 rounded-lg font-outfit font-bold shadow-md" style={{ top: pin.top, left: pin.left }}>
                {pin.label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-center text-sm">
            {[
              { icon: <Truck className="w-4 h-4" />, label: "Active Deliveries", value: "6" },
              { icon: <Clock className="w-4 h-4" />, label: "Pending Orders", value: "8" },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Completed Today", value: "24" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-center text-teal mb-1">{item.icon}</div>
                <p className="font-outfit font-bold text-navy">{item.value}</p>
                <p className="font-josefin text-gray-400 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <h3 className="font-outfit font-bold text-navy mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                <span className="text-lg flex-shrink-0">{activityIcons[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-josefin text-navy text-xs leading-relaxed">{item.message}</p>
                  <p className="font-josefin text-gray-400 text-xs mt-0.5">{formatRelative(item.time)}</p>
                </div>
                <Badge variant={activityBadge[item.status] ?? "gray"} className="flex-shrink-0 text-xs">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { emoji: "👥", label: "Customers", value: "184", sub: "active users" },
          { emoji: "🏪", label: "Suppliers", value: "23", sub: "approved" },
          { emoji: "🛵", label: "Riders", value: "14", sub: "registered" },
          { emoji: "⛵", label: "Boat Operators", value: "6", sub: "active" },
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
