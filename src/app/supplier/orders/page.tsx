"use client";
import { useEffect, useState } from "react";
import { Check, X, Clock, ChevronDown, RefreshCw } from "lucide-react";
import { formatKES, formatRelative } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersByCategory, updateOrderStatus, tsToDate } from "@/lib/firebase/db";
import type { Order, OrderStatus } from "@/lib/firebase/db";

const statusVariant: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  ready: "teal",
};

const ACTIVE = new Set(["pending", "confirmed", "ready"]);

export default function SupplierOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    if (!user?.serviceCategory) return;
    setLoading(true);
    try {
      const all = await getOrdersByCategory(user.serviceCategory);
      setOrders(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.uid]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    try {
      const extra = status === "confirmed"
        ? { supplierId: user?.uid, supplierName: user?.businessName ?? user?.name }
        : {};
      await updateOrderStatus(orderId, status, extra);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status, ...extra } : o));
      const msgs: Record<string, string> = {
        confirmed: "Order confirmed!",
        ready: "Marked as ready for pickup",
        cancelled: "Order rejected",
      };
      toast.success(msgs[status] ?? "Status updated");
    } catch {
      toast.error("Failed to update order");
    }
  }

  const activeOrders = orders.filter((o) => ACTIVE.has(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE.has(o.status));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Incoming Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {activeOrders.filter((o) => o.status === "pending").length} pending · {orders.length} total
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card animate-pulse h-28 bg-gray-50" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-outfit font-bold text-navy mb-1">No orders yet</p>
          <p className="font-josefin text-gray-400 text-sm">Orders matching your category will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...activeOrders, ...pastOrders].map((order) => (
            <div
              key={order.id}
              className={`card ${order.status === "pending" ? "border-l-4 border-l-orange ring-1 ring-orange/20" : ""}`}
            >
              {order.status === "pending" && (
                <div className="flex items-center gap-2 mb-3 text-orange">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span className="font-josefin font-semibold text-xs">New Order — Action Required</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">{formatRelative(tsToDate(order.createdAt))}</p>
                  <p className="font-outfit font-bold text-navy text-sm mt-0.5">{order.customerName}</p>
                  <p className="font-josefin text-gray-400 text-xs">📞 {order.customerPhone}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusVariant[order.status] ?? "gray"}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <p className="font-outfit font-bold text-navy">{formatKES(order.total)}</p>
                </div>
              </div>

              <button
                className="flex items-center gap-1 text-teal font-josefin text-xs font-semibold mt-2 hover:text-navy transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} />
                View Details
              </button>

              {expanded === order.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="font-josefin text-gray-600">{item.name} × {item.quantity}</span>
                      <span className="font-outfit font-semibold text-navy">{formatKES(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="font-josefin text-xs text-gray-400">📍 Delivery to:</p>
                    <p className="font-josefin text-navy text-sm">{order.deliveryAddress}</p>
                  </div>
                  {order.notes && (
                    <p className="font-josefin text-gray-400 text-xs italic">Note: {order.notes}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {order.status === "pending" && (
                  <>
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => changeStatus(order.id, "confirmed")}>
                      <Check className="w-3.5 h-3.5" /> Accept
                    </Button>
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => changeStatus(order.id, "cancelled")}>
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button variant="teal" size="sm" className="flex-1" onClick={() => changeStatus(order.id, "ready")}>
                    ✅ Mark Ready for Pickup
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
