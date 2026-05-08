"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Phone, MessageCircle, X } from "lucide-react";
// STATUS_LABELS used implicitly via ORDER_TIMELINE labels
import type { OrderStatus } from "@/lib/utils";
import Button from "@/components/ui/Button";

const ORDER_TIMELINE: { status: OrderStatus; label: string; time: string; done: boolean }[] = [
  { status: "pending", label: "Order Placed", time: "2:30 PM", done: true },
  { status: "confirmed", label: "Order Confirmed", time: "2:31 PM", done: true },
  { status: "rider_assigned", label: "Rider Assigned", time: "2:35 PM", done: true },
  { status: "picked_up", label: "Picked Up", time: "2:55 PM", done: false },
  { status: "delivered", label: "Delivered", time: "~3:10 PM", done: false },
];

const RIDER = {
  name: "Hassan Mwangi",
  phone: "+254712345678",
  vehicle: "Bicycle",
  eta: "25 mins",
  rating: 4.8,
};

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Live Tracking</h1>
          <p className="font-josefin text-gray-500 text-sm">Order #{orderId}</p>
        </div>
        <button
          onClick={() => setCancelOpen(true)}
          className="text-red-500 font-josefin text-sm hover:text-red-700 transition-colors"
        >
          Cancel Order
        </button>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gradient-to-br from-navy to-teal rounded-2xl h-64 flex items-center justify-center mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-9.5zM0 0v5h5V0H0zm0 15h5V10H0v5z'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="text-center z-10">
          <div className="text-5xl mb-2 animate-pulse-soft">📍</div>
          <p className="font-josefin text-white font-semibold">Live Map — Google Maps</p>
          <p className="font-josefin text-white/60 text-sm">Rider location updates every 30s</p>
        </div>

        {/* Rider pin */}
        <div className="absolute top-1/3 left-1/3 bg-orange text-white text-xs px-2 py-1 rounded-lg font-outfit font-bold shadow-lg">
          🛵 {RIDER.eta}
        </div>
      </div>

      {/* Rider Info */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="font-outfit font-bold text-white text-lg">
              {RIDER.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-outfit font-bold text-navy">{RIDER.name}</p>
            <p className="font-josefin text-gray-400 text-sm">{RIDER.vehicle} · ⭐ {RIDER.rating}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`tel:${RIDER.phone}`}>
              <Button variant="teal" size="sm" className="p-2.5">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
            <a href={`https://wa.me/${RIDER.phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="p-2.5 bg-green-500 hover:bg-green-600">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="font-josefin text-gray-500 text-sm">Estimated arrival</span>
          <span className="font-outfit font-bold text-orange text-lg">{RIDER.eta}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Order Status</h3>
        <div className="space-y-0">
          {ORDER_TIMELINE.map((item, i) => (
            <div key={item.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 mt-1 ${
                  item.done ? "bg-green-400 border-green-400" :
                  i === ORDER_TIMELINE.findIndex((t) => !t.done) ? "bg-orange border-orange animate-pulse" :
                  "bg-gray-100 border-gray-300"
                }`} />
                {i < ORDER_TIMELINE.length - 1 && (
                  <div className={`w-0.5 h-10 ${item.done ? "bg-green-200" : "bg-gray-100"}`} />
                )}
              </div>
              <div className="pb-6 flex-1 flex justify-between">
                <p className={`font-josefin font-semibold text-sm ${item.done ? "text-navy" : "text-gray-400"}`}>
                  {item.label}
                </p>
                <p className="font-josefin text-gray-400 text-xs">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setCancelOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-outfit font-bold text-xl text-navy">Cancel Order?</h3>
              <button onClick={() => setCancelOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="font-josefin text-gray-600 text-sm mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setCancelOpen(false)}>
                Keep Order
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={() => setCancelOpen(false)}>
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
