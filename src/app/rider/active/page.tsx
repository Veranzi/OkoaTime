"use client";
import { useState } from "react";
import { Phone, MessageCircle, Camera, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Step = "navigate_pickup" | "pickup" | "navigate_customer" | "deliver" | "done";

const STEPS: { key: Step; label: string; desc: string; buttonLabel: string; nextStep: Step | null }[] = [
  { key: "navigate_pickup", label: "Navigate to Pickup", desc: "Head to the supplier's location", buttonLabel: "I'm at Pickup Location", nextStep: "pickup" },
  { key: "pickup", label: "Pick Up Order", desc: "Collect the items from the supplier", buttonLabel: "Mark as Picked Up", nextStep: "navigate_customer" },
  { key: "navigate_customer", label: "Navigate to Customer", desc: "Deliver to the customer's address", buttonLabel: "I'm at Customer's Location", nextStep: "deliver" },
  { key: "deliver", label: "Complete Delivery", desc: "Hand over items and take a photo", buttonLabel: "Mark as Delivered", nextStep: "done" },
  { key: "done", label: "Delivery Complete", desc: "Great job! Earnings added.", buttonLabel: "Back to Home", nextStep: null },
];

const ORDER = {
  id: "OT-R2X3M-IJ90",
  customer: "Fatuma Hassan",
  phone: "+254712345678",
  items: "2x Grilled Tuna, 1x King Prawns",
  pickupAddress: "Fatuma Fresh Fish, near Lamu market",
  deliveryAddress: "Near the old fort, Lamu Town",
  payout: 120,
};

export default function ActiveDeliveryPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("navigate_pickup");
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const step = STEPS[stepIndex];

  function handleNext() {
    if (currentStep === "deliver" && !photoUploaded) {
      toast.error("Please upload a delivery photo first");
      return;
    }
    if (step.nextStep === null) {
      router.push("/rider");
      return;
    }
    setCurrentStep(step.nextStep);
    toast.success(`${step.label} — done!`);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Active Delivery</h1>
        <span className="font-josefin text-gray-400 text-sm">#{ORDER.id}</span>
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

      {/* Map */}
      <div className="bg-gradient-to-br from-navy to-teal rounded-2xl h-52 flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="text-center z-10">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="font-josefin text-white font-semibold text-sm">Google Maps Route</p>
          <p className="font-josefin text-white/60 text-xs">
            {currentStep === "navigate_pickup" || currentStep === "pickup"
              ? ORDER.pickupAddress
              : ORDER.deliveryAddress}
          </p>
        </div>
        <div className="absolute top-3 right-3 bg-orange text-white text-xs px-2 py-1 rounded-lg font-outfit font-bold">
          📍 Live
        </div>
      </div>

      {/* Order Info */}
      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="font-outfit font-bold text-white text-lg">{ORDER.customer.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="font-outfit font-bold text-navy">{ORDER.customer}</p>
            <p className="font-josefin text-gray-400 text-sm">{ORDER.items}</p>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${ORDER.phone}`}>
              <Button variant="teal" size="sm" className="p-2.5">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
            <a href={`https://wa.me/${ORDER.phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="p-2.5 bg-green-500 hover:bg-green-600">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span className="font-josefin text-gray-500">Pickup:</span>
            <span className="font-josefin font-semibold text-navy">{ORDER.pickupAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange">📍</span>
            <span className="font-josefin text-gray-500">Delivery:</span>
            <span className="font-josefin font-semibold text-navy">{ORDER.deliveryAddress}</span>
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
          <p className="font-outfit font-bold text-green-600 text-xl">+KES {ORDER.payout} earned! 🎉</p>
        </div>
      )}
    </div>
  );
}
