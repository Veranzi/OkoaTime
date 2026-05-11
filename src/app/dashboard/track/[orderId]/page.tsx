"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Phone, MessageCircle, Check, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import GoogleMapComponent from "@/components/ui/GoogleMap";
import { listenToOrder, updateOrderStatus } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";
import toast from "react-hot-toast";

const TIMELINE: { status: string; label: string }[] = [
  { status: "pending",        label: "Order Placed" },
  { status: "confirmed",      label: "Order Confirmed" },
  { status: "rider_assigned", label: "Rider Assigned" },
  { status: "picked_up",      label: "Rider on the Way" },
  { status: "delivered",      label: "Delivered" },
];

const STATUS_ORDER = ["pending", "confirmed", "rider_assigned", "picked_up", "delivered"];

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToOrder(orderId, (o) => {
      setOrder(o);
      setLoading(false);
    });
    return unsubscribe;
  }, [orderId]);

  async function handleCancel() {
    if (!order) return;
    try {
      await updateOrderStatus(order.id, "cancelled");
      toast.success("Order cancelled");
      router.push("/dashboard/orders");
    } catch {
      toast.error("Could not cancel order");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-outfit font-bold text-navy mb-2">Order not found</p>
          <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/orders")}>
            <ArrowLeft className="w-4 h-4" /> My Orders
          </Button>
        </div>
      </div>
    );
  }

  if (order.status === "delivered") {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="font-outfit font-black text-2xl text-navy mb-2">Order Delivered!</h2>
          <p className="font-josefin text-gray-500 text-sm mb-6">
            Your order has been delivered. Enjoy your items!
          </p>
          <Button variant="primary" size="md" onClick={() => router.push("/dashboard/orders")}>
            View Order History
          </Button>
        </div>
      </div>
    );
  }

  const riderPos = order.riderLat && order.riderLng
    ? { lat: order.riderLat, lng: order.riderLng }
    : undefined;

  const destPos = order.deliveryLat && order.deliveryLng
    ? { lat: order.deliveryLat, lng: order.deliveryLng }
    : undefined;

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="page-header">Live Tracking</h1>
          <p className="font-josefin text-gray-500 text-sm">Order #{order.id.slice(0, 12)}</p>
        </div>
        {order.status !== "cancelled" && order.status !== "delivered" && order.status === "pending" && (
          <button
            onClick={() => setCancelOpen(true)}
            className="text-red-500 font-josefin text-sm hover:text-red-700 transition-colors self-start sm:self-auto"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Live Map */}
      <div className="relative mb-6">
        <GoogleMapComponent
          riderLocation={riderPos ?? { lat: -2.2694, lng: 40.9023 }}
          destinationLocation={destPos ?? { lat: -2.2750, lng: 40.9080 }}
          height="h-64"
          zoom={15}
        />
        {riderPos && (
          <div className="absolute top-3 right-3 bg-orange text-white text-xs px-2 py-1 rounded-lg font-outfit font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live
          </div>
        )}
      </div>

      {/* Rider Info */}
      {order.riderName && (
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="font-outfit font-bold text-white text-lg">
                  {order.riderName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-outfit font-bold text-navy truncate">{order.riderName}</p>
                <p className="font-josefin text-gray-400 text-sm">Rider · On the way</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${order.customerPhone}`}>
                <Button variant="teal" size="sm" className="p-2.5">
                  <Phone className="w-4 h-4" />
                </Button>
              </a>
              <a href={`https://wa.me/${order.customerPhone?.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="p-2.5 bg-green-500 hover:bg-green-600 text-white">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="font-josefin text-gray-500 text-sm">📍 Delivering to: <span className="font-semibold text-navy">{order.deliveryAddress}</span></p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Order Status</h3>
        <div className="space-y-0">
          {TIMELINE.map((item, i) => {
            const done = STATUS_ORDER.indexOf(item.status) <= currentStatusIndex;
            const isActive = item.status === order.status;
            return (
              <div key={item.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 mt-1 ${
                    done && !isActive ? "bg-green-400 border-green-400" :
                    isActive ? "bg-orange border-orange animate-pulse" :
                    "bg-gray-100 border-gray-300"
                  }`} />
                  {i < TIMELINE.length - 1 && (
                    <div className={`w-0.5 h-10 ${done ? "bg-green-200" : "bg-gray-100"}`} />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <p className={`font-josefin font-semibold text-sm ${done || isActive ? "text-navy" : "text-gray-400"}`}>
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setCancelOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-outfit font-bold text-xl text-navy mb-3">Cancel Order?</h3>
            <p className="font-josefin text-gray-600 text-sm mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setCancelOpen(false)}>
                Keep Order
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={handleCancel}>
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
