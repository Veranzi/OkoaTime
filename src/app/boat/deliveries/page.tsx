"use client";
import { useEffect, useState, useRef } from "react";
import { Phone, RefreshCw, MapPin, Package, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import GoogleMapComponent from "@/components/ui/GoogleMap";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getPendingBoatOrders, getDirectBoatOrders, getWaterDeliveryOrders, updateOrderStatus, updateOrder } from "@/lib/firebase/db";
import type { Order, OrderStatus } from "@/lib/firebase/db";
import { formatKES } from "@/lib/utils";

type Tab = "available" | "active";

function statusBadge(status: OrderStatus) {
  if (status === "at_jetty") return <Badge variant="orange">At Jetty</Badge>;
  if (status === "confirmed") return <Badge variant="yellow">Confirmed</Badge>;
  if (status === "boat_assigned") return <Badge variant="blue">Assigned</Badge>;
  if (status === "on_water") return <Badge variant="teal">On Water</Badge>;
  if (status === "delivered") return <Badge variant="green">Delivered</Badge>;
  return <Badge variant="gray">{status}</Badge>;
}

export default function BoatDeliveriesPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [boatPos, setBoatPos] = useState<{ lat: number; lng: number } | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [jetty, direct, mine] = await Promise.all([
        getPendingBoatOrders(),
        getDirectBoatOrders(),
        getWaterDeliveryOrders(user.uid),
      ]);
      // Available = at_jetty (bike+boat handoffs) + confirmed boat-type orders
      const availableIds = new Set(jetty.map((o) => o.id));
      const merged = [...jetty, ...direct.filter((o) => !availableIds.has(o.id))];
      setAvailable(merged);
      // Active = my assigned orders not yet delivered
      setActive(mine.filter((o) => o.status === "boat_assigned" || o.status === "on_water"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.uid]);

  // Share boat GPS location to Firestore every 10 seconds for active deliveries
  useEffect(() => {
    const hasActive = active.length > 0;
    if (!hasActive) return;

    function writeLocation() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setBoatPos({ lat, lng });
        active.forEach((o) => {
          if (o.status === "on_water") {
            updateOrder(o.id, { boatLat: lat, boatLng: lng }).catch(() => {});
          }
        });
      });
    }

    writeLocation();
    locationIntervalRef.current = setInterval(writeLocation, 10000);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [active]);

  async function acceptDelivery(order: Order) {
    if (!user?.uid) return;
    try {
      await updateOrderStatus(order.id, "boat_assigned", {
        boatOperatorId: user.uid,
        boatOperatorName: user.name,
      });
      toast.success("Delivery accepted!");
      await load();
      setTab("active");
    } catch { toast.error("Failed to accept delivery"); }
  }

  async function advanceStatus(order: Order) {
    try {
      if (order.status === "boat_assigned") {
        await updateOrderStatus(order.id, "on_water");
        toast.success("Departure confirmed — you are on the water!");
      } else if (order.status === "on_water") {
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        await updateOrderStatus(order.id, "delivered");
        toast.success("Delivery marked complete!");
      }
      await load();
    } catch { toast.error("Failed to update status"); }
  }

  const orders = tab === "available" ? available : active;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Delivery Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            Goods delivery via water
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["available", "active"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl font-josefin font-semibold text-sm transition-all ${
              tab === t ? "bg-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t === "available" ? `Available (${available.length})` : `My Active (${active.length})`}
          </button>
        ))}
      </div>

      {/* Active delivery map */}
      {tab === "active" && active.some((o) => o.status === "on_water") && (
        <div className="relative mb-6">
          <GoogleMapComponent
            riderLocation={boatPos ?? { lat: -2.2694, lng: 40.9023 }}
            destinationLocation={
              active.find((o) => o.status === "on_water")?.deliveryLat
                ? { lat: active.find((o) => o.status === "on_water")!.deliveryLat!, lng: active.find((o) => o.status === "on_water")!.deliveryLng! }
                : { lat: -2.2750, lng: 40.9080 }
            }
            height="h-52"
            zoom={14}
          />
          <div className="absolute top-3 right-3 bg-navy text-white text-xs px-2 py-1 rounded-lg font-outfit font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-teal rounded-full animate-pulse" /> ⛵ Live
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="card animate-pulse h-36 bg-gray-50" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⛵</p>
          <p className="font-outfit font-bold text-navy mb-1">
            {tab === "available" ? "No deliveries waiting" : "No active deliveries"}
          </p>
          <p className="font-josefin text-gray-400 text-sm">
            {tab === "available"
              ? "Orders needing water delivery will appear here."
              : "Accept an order from the Available tab to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className={`card ${order.status === "at_jetty" || order.status === "confirmed" ? "border-l-4 border-l-orange" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">#{order.id.slice(0, 10)}</p>
                  <p className="font-outfit font-bold text-navy mt-0.5">{order.customerName}</p>
                  <p className="font-josefin text-gray-500 text-sm">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {statusBadge(order.status)}
                  <p className="font-outfit font-bold text-navy">{formatKES(order.total)}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {order.status === "at_jetty" && (
                  <div className="flex items-center gap-2 text-orange font-josefin text-xs font-semibold">
                    <Package className="w-3.5 h-3.5" />
                    <span>Bike handoff at jetty — ready for pickup</span>
                  </div>
                )}
                {order.status === "confirmed" && (
                  <div className="flex items-center gap-2 text-teal font-josefin text-xs font-semibold">
                    <Package className="w-3.5 h-3.5" />
                    <span>Direct boat order — supplier ready at waterfront</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-orange flex-shrink-0 mt-0.5" />
                  <span className="font-josefin text-gray-600 text-xs">{order.deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 font-josefin text-teal text-xs hover:text-navy transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    {order.customerPhone}
                  </a>
                </div>
              </div>

              {tab === "available" && (
                <Button variant="primary" size="sm" className="w-full" onClick={() => acceptDelivery(order)}>
                  <Check className="w-3.5 h-3.5" /> Accept This Delivery
                </Button>
              )}

              {tab === "active" && order.status === "boat_assigned" && (
                <Button variant="teal" size="sm" className="w-full" onClick={() => advanceStatus(order)}>
                  ⛵ Start Water Delivery
                </Button>
              )}

              {tab === "active" && order.status === "on_water" && (
                <Button variant="primary" size="sm" className="w-full" onClick={() => advanceStatus(order)}>
                  <Check className="w-3.5 h-3.5" /> Mark as Delivered
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
