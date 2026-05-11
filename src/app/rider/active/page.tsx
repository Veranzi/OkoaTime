"use client";
import { useState, useEffect, useRef } from "react";
import { Phone, MessageCircle, Check, Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import GoogleMapComponent from "@/components/ui/GoogleMap";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOrdersByRider, updateOrderStatus, updateOrder } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

type Step = "navigate_pickup" | "pickup" | "navigate_customer" | "deliver" | "done";

const STEPS: { key: Step; label: string; desc: string; buttonLabel: string; nextStep: Step | null }[] = [
  { key: "navigate_pickup",    label: "Navigate to Pickup",    desc: "Head to the supplier's location",     buttonLabel: "I'm at Pickup Location",    nextStep: "pickup" },
  { key: "pickup",             label: "Pick Up Order",          desc: "Collect the items from the supplier", buttonLabel: "Mark as Picked Up",          nextStep: "navigate_customer" },
  { key: "navigate_customer",  label: "Navigate to Customer",   desc: "Deliver to the customer's address",   buttonLabel: "I'm at Customer's Location", nextStep: "deliver" },
  { key: "deliver",            label: "Complete Delivery",       desc: "Hand over items and take a photo",    buttonLabel: "Mark as Delivered",          nextStep: "done" },
  { key: "done",               label: "Delivery Complete",       desc: "Great job! Earnings added.",          buttonLabel: "Back to Home",               nextStep: null },
];

export default function ActiveDeliveryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>("navigate_pickup");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active order
  useEffect(() => {
    if (!user?.uid) return;
    getOrdersByRider(user.uid).then((orders) => {
      const active = orders.find((o) => o.status === "rider_assigned" || o.status === "picked_up");
      setOrder(active ?? null);
      if (active?.status === "picked_up") setCurrentStep("navigate_customer");
    }).finally(() => setLoading(false));
  }, [user?.uid]);

  // Share rider GPS location to Firestore every 10 seconds while active
  useEffect(() => {
    if (!order?.id || currentStep === "done") return;

    function writeLocation() {
      if (!navigator.geolocation || !order?.id) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setRiderPos({ lat, lng });
        updateOrder(order.id, { riderLat: lat, riderLng: lng }).catch(() => {});
      });
    }

    writeLocation();
    locationIntervalRef.current = setInterval(writeLocation, 10000);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [order?.id, currentStep]);

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const step = STEPS[stepIndex];

  const mapCenter = currentStep === "navigate_pickup" || currentStep === "pickup"
    ? { lat: -2.2694, lng: 40.9023 }
    : order?.deliveryLat && order?.deliveryLng
      ? { lat: order.deliveryLat, lng: order.deliveryLng }
      : { lat: -2.2750, lng: 40.9080 };

  async function handleNext() {
    if (currentStep === "deliver" && !photoUploaded) {
      toast.error("Please upload a delivery photo first");
      return;
    }
    if (!order) { toast.error("No active order"); return; }

    if (currentStep === "pickup") {
      await updateOrderStatus(order.id, "picked_up");
      setOrder((prev) => prev ? { ...prev, status: "picked_up" } : prev);
    }

    if (currentStep === "deliver") {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      await updateOrderStatus(order.id, "delivered", { riderPayout: order.riderPayout ?? 120 });
      setOrder((prev) => prev ? { ...prev, status: "delivered" } : prev);
    }

    if (step.nextStep === null) {
      router.push("/rider");
      return;
    }

    toast.success(`${step.label} — done!`);
    setCurrentStep(step.nextStep);
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-xl w-48" />
          <div className="h-52 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🛵</p>
          <p className="font-outfit font-bold text-navy text-lg mb-2">No Active Delivery</p>
          <p className="font-josefin text-gray-400 text-sm mb-6">
            You don&apos;t have an active order right now. Check available orders to accept one.
          </p>
          <Button variant="primary" size="sm" onClick={() => router.push("/rider/orders")}>
            View Available Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Active Delivery</h1>
        <span className="font-josefin text-gray-400 text-sm">#{order.id.slice(0, 12)}</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.slice(0, -1).map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-outfit font-bold transition-all ${
              i < stepIndex ? "bg-green-400 text-white" :
              i === stepIndex ? "bg-orange text-white" :
              "bg-gray-100 text-gray-400"
            }`}>
              {i < stepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 2 && <div className={`h-0.5 w-8 ${i < stepIndex ? "bg-green-300" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Live Map */}
      <div className="relative mb-4">
        <GoogleMapComponent
          riderLocation={riderPos ?? { lat: -2.2694, lng: 40.9023 }}
          destinationLocation={mapCenter}
          height="h-52"
          zoom={15}
        />
        <div className="absolute top-3 right-3 bg-orange text-white text-xs px-2 py-1 rounded-lg font-outfit font-bold flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live
        </div>
      </div>

      {/* Order Info */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="font-outfit font-bold text-white text-lg">{order.customerName.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-outfit font-bold text-navy truncate">{order.customerName}</p>
            <p className="font-josefin text-gray-400 text-sm truncate">
              {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
            </p>
          </div>
          <div className="flex gap-2 ml-auto flex-shrink-0">
            <a href={`tel:${order.customerPhone}`}>
              <Button variant="teal" size="sm" className="p-2.5"><Phone className="w-4 h-4" /></Button>
            </a>
            <a href={`https://wa.me/${order.customerPhone.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="p-2.5 bg-green-500 hover:bg-green-600 text-white"><MessageCircle className="w-4 h-4" /></Button>
            </a>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-gray-100 text-sm">
          {order.supplierName && (
            <div className="flex items-start gap-2">
              <span className="text-green-400 flex-shrink-0">●</span>
              <span className="font-josefin text-gray-500 flex-shrink-0">Pickup:</span>
              <span className="font-josefin font-semibold text-navy">{order.supplierName}</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-orange flex-shrink-0">📍</span>
            <span className="font-josefin text-gray-500 flex-shrink-0">Delivery:</span>
            <span className="font-josefin font-semibold text-navy">{order.deliveryAddress}</span>
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className={`card border-2 mb-4 ${currentStep === "done" ? "border-green-300 bg-green-50" : "border-orange/30"}`}>
        <p className="font-josefin text-gray-400 text-xs uppercase tracking-wider mb-1">Current Step</p>
        <p className="font-outfit font-bold text-navy text-lg mb-1">{step.label}</p>
        <p className="font-josefin text-gray-500 text-sm">{step.desc}</p>

        {currentStep === "deliver" && (
          <div className="mt-4">
            <label className="label">Delivery Photo (required)</label>
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange transition-colors">
              <Camera className="w-6 h-6 text-gray-400" />
              <div>
                <p className="font-josefin font-semibold text-navy text-sm">
                  {photoUploaded ? "✅ Photo uploaded" : "Upload delivery photo"}
                </p>
                <p className="font-josefin text-gray-400 text-xs">Take a photo of the delivered items</p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={() => { setPhotoUploaded(true); toast.success("Photo uploaded!"); }}
              />
            </label>
          </div>
        )}
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
        {step.buttonLabel}
      </Button>

      {currentStep === "done" && (
        <div className="text-center mt-4">
          <p className="font-outfit font-bold text-green-600 text-xl">+KES {order.riderPayout ?? 120} earned! 🎉</p>
        </div>
      )}
    </div>
  );
}
