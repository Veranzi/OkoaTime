"use client";
import { useState } from "react";
import { Check, X, Clock, ChevronDown } from "lucide-react";
import { formatKES, formatRelative } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

type OrderStatus = "pending" | "confirmed" | "ready" | "delivered" | "cancelled";

interface IncomingOrder {
  id: string;
  customer: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  address: string;
  total: number;
  status: OrderStatus;
  time: Date;
}

const INITIAL_ORDERS: IncomingOrder[] = [
  {
    id: "OT-K3X2P-AB12",
    customer: "Fatuma Hassan",
    phone: "+254712345678",
    items: [
      { name: "Grilled Tuna (500g)", qty: 2, price: 450 },
      { name: "King Prawns (300g)", qty: 1, price: 680 },
    ],
    address: "Near the old fort, Lamu Town",
    total: 1580,
    status: "pending",
    time: new Date(Date.now() - 3 * 60000),
  },
  {
    id: "OT-M1Y9Q-CD34",
    customer: "Ahmed Bakari",
    phone: "+254723456789",
    items: [{ name: "Lobster (1kg)", qty: 1, price: 1200 }],
    address: "Shela village, seafront",
    total: 1200,
    status: "confirmed",
    time: new Date(Date.now() - 20 * 60000),
  },
  {
    id: "OT-P5Z7R-EF56",
    customer: "David Omondi",
    phone: "+254734567890",
    items: [{ name: "Snapper Fish (1kg)", qty: 3, price: 380 }],
    address: "Manda Island jetty",
    total: 1140,
    status: "delivered",
    time: new Date(Date.now() - 2 * 3600000),
  },
];

const statusVariant: Record<OrderStatus, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  ready: "teal",
};

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<IncomingOrder[]>(INITIAL_ORDERS);
  const [expanded, setExpanded] = useState<string | null>(null);

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const msgs: Record<string, string> = {
      confirmed: "Order confirmed!",
      ready: "Order marked as ready for pickup",
      cancelled: "Order rejected",
    };
    toast.success(msgs[status] ?? "Status updated");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Incoming Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {orders.filter((o) => o.status === "pending").length} pending · {orders.length} total
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
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
                <p className="font-josefin text-gray-400 text-xs">{formatRelative(order.time)}</p>
                <p className="font-outfit font-bold text-navy text-sm mt-0.5">{order.customer}</p>
                <p className="font-josefin text-gray-400 text-xs">📞 {order.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusVariant[order.status]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <p className="font-outfit font-bold text-navy">{formatKES(order.total)}</p>
              </div>
            </div>

            {/* Expand/Collapse */}
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
                    <span className="font-josefin text-gray-600">{item.name} × {item.qty}</span>
                    <span className="font-outfit font-semibold text-navy">{formatKES(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-josefin text-xs text-gray-400">📍 Delivery to:</p>
                  <p className="font-josefin text-navy text-sm">{order.address}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              {order.status === "pending" && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus(order.id, "confirmed")}
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus(order.id, "cancelled")}
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                </>
              )}
              {order.status === "confirmed" && (
                <Button
                  variant="teal"
                  size="sm"
                  className="flex-1"
                  onClick={() => updateStatus(order.id, "ready")}
                >
                  ✅ Mark Ready for Pickup
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
