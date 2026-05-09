"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, DollarSign, Package, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { formatKES, formatRelative } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getOrdersByCategory, getProductsBySupplier, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const statusVariant: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  ready: "teal",
  rider_assigned: "teal",
  picked_up: "orange",
};

export default function SupplierDashboard() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    if (user.serviceCategory) {
      getOrdersByCategory(user.serviceCategory).then(setOrders).catch(() => {});
    }
    getProductsBySupplier(user.uid).then((p) => setProductCount(p.length)).catch(() => {});
  }, [user?.uid]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((o) => tsToDate(o.createdAt) >= today);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const todaysRevenue = todaysOrders.reduce((s, o) => s + o.total, 0);
  const recentOrders = orders.slice(0, 3);

  const stats = [
    { label: "Today's Orders", value: todaysOrders.length.toString(), icon: <ShoppingBag className="w-5 h-5" />, color: "teal" as const },
    { label: "Today's Revenue", value: formatKES(todaysRevenue), icon: <DollarSign className="w-5 h-5" />, color: "orange" as const },
    { label: "Pending Orders", value: pendingOrders.length.toString(), icon: <Clock className="w-5 h-5" />, color: "navy" as const },
    { label: "Total Products", value: productCount.toString(), icon: <Package className="w-5 h-5" />, color: "green" as const },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="page-header">Good morning, {user?.name?.split(" ")[0] ?? "Supplier"} 👋</h1>
        <p className="font-josefin text-gray-500 text-sm mt-1">{user?.businessName ?? "Your Business"} · {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

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
                <p className="font-josefin text-gray-400 text-xs">{pendingOrders.length} pending</p>
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
                <p className="font-josefin text-gray-400 text-xs">View revenue</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </div>
          </Link>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-outfit font-bold text-lg text-navy">Recent Orders</h2>
            <Link href="/supplier/orders" className="text-teal font-josefin text-sm font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="card flex items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-josefin text-gray-400 text-xs">{formatRelative(tsToDate(order.createdAt))}</p>
                  <p className="font-josefin font-semibold text-navy text-sm truncate">{order.customerName}</p>
                  <p className="font-josefin text-gray-500 text-xs truncate">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
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
      )}
    </div>
  );
}
