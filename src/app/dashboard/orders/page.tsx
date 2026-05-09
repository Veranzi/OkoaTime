"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, RotateCcw, ChevronRight, RefreshCw } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersByCustomer, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusVariant: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  ready: "teal",
  rider_assigned: "teal",
  picked_up: "orange",
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      setOrders(await getOrdersByCustomer(user.uid));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.uid]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Order History</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/dashboard/order/new">
            <Button variant="primary" size="sm">New Order</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-50" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="font-outfit font-bold text-navy mb-1">No orders yet</p>
          <p className="font-josefin text-gray-400 text-sm mb-4">Place your first order to get started.</p>
          <Link href="/dashboard/order/new">
            <Button variant="primary" size="sm">Place Order</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">{formatDate(tsToDate(order.createdAt))}</p>
                  <p className="font-outfit font-bold text-navy text-sm mt-0.5">#{order.id.slice(0, 12)}</p>
                  <p className="font-josefin text-gray-500 text-xs mt-0.5">
                    {order.category} · {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                </div>
                <Badge variant={statusVariant[order.status] ?? "gray"}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="font-outfit font-bold text-navy">{formatKES(order.total)}</p>
                <div className="flex items-center gap-2">
                  {(order.status === "rider_assigned" || order.status === "picked_up") && (
                    <Link href={`/dashboard/track/${order.id}`}>
                      <Button variant="teal" size="sm">
                        <MapPin className="w-3.5 h-3.5" /> Track
                      </Button>
                    </Link>
                  )}
                  {order.status === "delivered" && (
                    <Link href="/dashboard/order/new">
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-3.5 h-3.5" /> Reorder
                      </Button>
                    </Link>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
