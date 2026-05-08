"use client";
import Link from "next/link";
import { ShoppingBag, DollarSign, Package, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { formatKES, formatRelative } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const stats = [
  { label: "Today's Orders", value: "12", icon: <ShoppingBag className="w-5 h-5" />, color: "teal" as const, trend: "+3 from yesterday" },
  { label: "Today's Revenue", value: formatKES(8450), icon: <DollarSign className="w-5 h-5" />, color: "orange" as const, trend: "+KES 1,200 from yesterday" },
  { label: "Pending Orders", value: "3", icon: <Clock className="w-5 h-5" />, color: "navy" as const },
  { label: "Total Products", value: "24", icon: <Package className="w-5 h-5" />, color: "green" as const },
];

const recentOrders = [
  { id: "OT-K3X2P-AB12", customer: "Fatuma Hassan", items: "2x Grilled Tuna", total: 900, status: "pending" as const, time: new Date(Date.now() - 5 * 60000) },
  { id: "OT-M1Y9Q-CD34", customer: "Ahmed Bakari", items: "3x King Prawns", total: 2040, status: "confirmed" as const, time: new Date(Date.now() - 25 * 60000) },
  { id: "OT-P5Z7R-EF56", customer: "Mama Rehema", items: "1x Lobster", total: 1200, status: "delivered" as const, time: new Date(Date.now() - 3 * 3600000) },
];

const statusVariant: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  rider_assigned: "teal",
  picked_up: "orange",
};

export default function SupplierDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="page-header">Good morning, {user?.name?.split(" ")[0] ?? "Supplier"} 👋</h1>
        <p className="font-josefin text-gray-500 text-sm mt-1">{user?.businessName ?? "Your Business"} · {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-outfit font-bold text-lg text-navy mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/supplier/products">
            <div className="card hover:shadow-card-hover cursor-pointer flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-orange" />
              </div>
              <div>
                <p className="font-outfit font-bold text-navy text-sm">Add Product</p>
                <p className="font-josefin text-gray-400 text-xs">List new items</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </div>
          </Link>
          <Link href="/supplier/orders">
            <div className="card hover:shadow-card-hover cursor-pointer flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="font-outfit font-bold text-navy text-sm">View Orders</p>
                <p className="font-josefin text-gray-400 text-xs">3 pending</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </div>
          </Link>
          <Link href="/supplier/earnings">
            <div className="card hover:shadow-card-hover cursor-pointer flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-outfit font-bold text-navy text-sm">Earnings</p>
                <p className="font-josefin text-gray-400 text-xs">{formatKES(32400)} this week</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-outfit font-bold text-lg text-navy">Recent Orders</h2>
          <Link href="/supplier/orders" className="text-teal font-josefin text-sm font-semibold flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="card flex items-center justify-between">
              <div>
                <p className="font-josefin text-gray-400 text-xs">{formatRelative(order.time)}</p>
                <p className="font-josefin font-semibold text-navy text-sm">{order.customer}</p>
                <p className="font-josefin text-gray-500 text-xs">{order.items}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusVariant[order.status] ?? "gray"}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <p className="font-outfit font-bold text-navy text-sm">{formatKES(order.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
