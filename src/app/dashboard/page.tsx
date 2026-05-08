"use client";
import Link from "next/link";
import { ShoppingBag, Package, MapPin, ChevronRight, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { SERVICE_CATEGORIES, formatKES, formatRelative } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const mockActiveOrder = {
  id: "OT-K3X2P-AB12",
  status: "rider_assigned" as const,
  items: "2x Grilled Tuna, 1x King Prawns",
  total: 1580,
  riderName: "Hassan Mwangi",
  eta: "25 mins",
};

const mockOrders = [
  { id: "OT-K3X2P-AB12", category: "Seafood", status: "delivered", total: 2780, date: new Date(Date.now() - 86400000) },
  { id: "OT-M1Y9Q-CD34", category: "Groceries", status: "delivered", total: 1200, date: new Date(Date.now() - 2 * 86400000) },
  { id: "OT-P5Z7R-EF56", category: "Fruits & Veg", status: "cancelled", total: 650, date: new Date(Date.now() - 3 * 86400000) },
];

const statusBadge = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  rider_assigned: "teal",
  picked_up: "orange",
} as const;

export default function DashboardPage() {
  const { user } = useAuthStore();

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
      <div className="bg-orange-50 border border-orange/20 rounded-2xl p-4 flex items-center gap-4">
        <span className="text-3xl">🎉</span>
        <div>
          <p className="font-outfit font-bold text-orange text-sm">First Order Free Delivery!</p>
          <p className="font-josefin text-gray-600 text-xs">Use code <strong>FIRST</strong> on your first order and enjoy free delivery.</p>
        </div>
        <Link href="/dashboard/order/new" className="ml-auto flex-shrink-0">
          <Button size="sm" variant="primary">Order Now</Button>
        </Link>
      </div>

      {/* Active Order */}
      <div>
        <h2 className="font-outfit font-bold text-lg text-navy mb-3">Active Order</h2>
        <div className="card border-l-4 border-l-teal">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-josefin text-gray-500 text-xs mb-1">Order #{mockActiveOrder.id}</p>
              <p className="font-josefin font-semibold text-navy text-sm">{mockActiveOrder.items}</p>
            </div>
            <Badge variant="teal">Rider Assigned</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
              <span>🛵</span> {mockActiveOrder.riderName}
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
              <Clock className="w-3.5 h-3.5" /> ETA {mockActiveOrder.eta}
            </div>
            <div className="font-outfit font-bold text-navy ml-auto">
              {formatKES(mockActiveOrder.total)}
            </div>
          </div>
          <Link href={`/dashboard/track/${mockActiveOrder.id}`} className="block mt-4">
            <Button variant="teal" size="sm" className="w-full">
              <MapPin className="w-4 h-4" /> Track Live
            </Button>
          </Link>
        </div>
      </div>

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
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-outfit font-bold text-lg text-navy">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-teal font-josefin text-sm font-semibold flex items-center gap-1 hover:text-navy transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {mockOrders.map((order) => (
            <div key={order.id} className="card flex items-center justify-between hover:shadow-card-hover">
              <div>
                <p className="font-josefin text-gray-400 text-xs mb-0.5">{formatRelative(order.date)}</p>
                <p className="font-josefin font-semibold text-navy text-sm">#{order.id}</p>
                <p className="font-josefin text-gray-500 text-xs">{order.category}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusBadge[order.status as keyof typeof statusBadge] ?? "gray"}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <p className="font-outfit font-bold text-navy text-sm">{formatKES(order.total)}</p>
                <Link href={`/dashboard/orders`}>
                  <button className="text-teal text-xs font-josefin hover:text-navy flex items-center gap-1">
                    Reorder <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
