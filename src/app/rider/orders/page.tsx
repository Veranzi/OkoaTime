"use client";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Package, RefreshCw } from "lucide-react";
import { formatKES, formatRelative } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getPendingOrders, updateOrderStatus, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const RIDER_SHARE = 0.7; // rider gets 70%, OkoaTime keeps 30% of delivery fee

const DELIVERY_BADGE: Record<string, string> = {
  bike: "🛵 Bike",
  bike_to_boat: "🛵➡️⛵ Bike + Boat",
};

export default function RiderOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getPendingOrders();
      // Boat-only deliveries go to boat operators, not riders
      setOrders(all.filter((o) => o.deliveryType !== "boat"));
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function acceptOrder(order: Order) {
    if (!user?.uid) return toast.error("Session expired — please sign in again.");
    setAccepting(order.id);
    try {
      await updateOrderStatus(order.id, "rider_assigned", {
        riderId: user.uid,
        riderName: user.name,
        riderPayout: Math.round(order.deliveryFee * RIDER_SHARE), // OkoaTime keeps 30%
      });
      toast.success("Order accepted! Head to the supplier.");
      router.push("/rider/active");
    } catch (err) {
      console.error("Accept order error:", err);
      toast.error("Failed to accept order. Try again.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Available Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {loading ? "Loading..." : `${orders.length} order${orders.length !== 1 ? "s" : ""} ready for pickup`}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="card animate-pulse h-40 bg-gray-50" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-outfit font-bold text-navy text-lg mb-2">No Orders Ready</p>
          <p className="font-josefin text-gray-500 text-sm mb-4">
            Orders appear here once a supplier marks them ready for pickup.
          </p>
          <button onClick={load} className="text-teal font-josefin font-semibold text-sm hover:text-navy transition-colors">
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card border-2 border-orange/30">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-josefin text-gray-400 text-xs mb-0.5">
                    {formatRelative(tsToDate(order.createdAt))}
                  </p>
                  <p className="font-outfit font-bold text-navy text-sm">
                    Order #{order.id.slice(0, 12)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="teal">Ready</Badge>
                    {order.deliveryType && DELIVERY_BADGE[order.deliveryType] && (
                      <span className="font-josefin text-xs text-gray-500">
                        {DELIVERY_BADGE[order.deliveryType]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-josefin text-gray-400 text-xs">Your payout</p>
                  <p className="font-outfit font-bold text-green-600 text-lg">
                    {formatKES(Math.round(order.deliveryFee * RIDER_SHARE))}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="flex items-start gap-2 mb-3 bg-gray-50 rounded-xl p-3">
                <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="font-josefin text-gray-600 text-sm">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </p>
              </div>

              {/* Route */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-josefin text-gray-400 text-xs uppercase tracking-wide">Pickup from</p>
                    <p className="font-josefin font-semibold text-navy text-sm">
                      {order.supplierName ?? "Supplier"}
                    </p>
                  </div>
                </div>
                <div className="ml-1.5 w-0.5 h-3 bg-gray-200" />
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-orange flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-josefin text-gray-400 text-xs uppercase tracking-wide">Deliver to</p>
                    <p className="font-josefin font-semibold text-navy text-sm">{order.deliveryAddress}</p>
                    <p className="font-josefin text-gray-400 text-xs">{order.customerName} · {order.customerPhone}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={accepting === order.id}
                onClick={() => acceptOrder(order)}
              >
                Accept — {formatKES(Math.round(order.deliveryFee * RIDER_SHARE))} payout
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
