"use client";
import { useState, useEffect } from "react";
import { MapPin, DollarSign } from "lucide-react";
import { formatKES } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AvailableOrder {
  id: string;
  pickupLocation: string;
  deliveryLocation: string;
  distanceKm: number;
  payout: number;
  items: string;
  timeout: number;
}

const MOCK_ORDERS: AvailableOrder[] = [
  { id: "OT-A1B2C3", pickupLocation: "Fatuma Fresh Fish, Lamu Town", deliveryLocation: "Shela beach house", distanceKm: 2.1, payout: 120, items: "2x Grilled Tuna, 1x Prawns", timeout: 30 },
  { id: "OT-D4E5F6", pickupLocation: "Mama Mboga, Lamu market", deliveryLocation: "Manda Island jetty", distanceKm: 3.8, payout: 180, items: "Tomatoes, Onions, Spinach", timeout: 30 },
];

function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const interval = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(interval);
  }, [remaining, onExpire]);

  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={remaining <= 10 ? "#E07B00" : "#0096B4"}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-outfit font-bold text-xs text-navy">
          {remaining}s
        </span>
      </div>
    </div>
  );
}

export default function RiderOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AvailableOrder[]>(MOCK_ORDERS);

  function expireOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast("Order expired — moved to next rider", { icon: "⏰" });
  }

  function acceptOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Order accepted! Head to pickup location.");
    router.push("/rider/active");
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Available Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {orders.length} orders nearby
          </p>
        </div>
        <Badge variant="green" className="animate-pulse">● Live</Badge>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-outfit font-bold text-navy text-lg mb-2">No Orders Nearby</p>
          <p className="font-josefin text-gray-500 text-sm">Stay online — new orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card border-2 border-orange/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-josefin text-gray-400 text-xs mb-1">#{order.id}</p>
                  <p className="font-josefin text-gray-600 text-sm italic">{order.items}</p>
                </div>
                <CountdownTimer seconds={order.timeout} onExpire={() => expireOrder(order.id)} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-josefin text-gray-400 text-xs">PICKUP</p>
                    <p className="font-josefin font-semibold text-navy text-sm">{order.pickupLocation}</p>
                  </div>
                </div>
                <div className="ml-1.5 w-0.5 h-4 bg-gray-200" />
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-orange flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-josefin text-gray-400 text-xs">DELIVERY</p>
                    <p className="font-josefin font-semibold text-navy text-sm">{order.deliveryLocation}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                  <MapPin className="w-3.5 h-3.5" /> {order.distanceKm} km
                </div>
                <div className="flex items-center gap-1.5 font-outfit font-bold text-green-600">
                  <DollarSign className="w-3.5 h-3.5" /> {formatKES(order.payout)}
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => acceptOrder(order.id)}
              >
                Accept Order
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
