"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Check, MapPin, ShoppingCart, CreditCard } from "lucide-react";
import { SERVICE_CATEGORIES, formatKES, toMpesaPhone } from "@/lib/utils";
import { useOrderStore } from "@/lib/store/useOrderStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import GoogleMapComponent from "@/components/ui/GoogleMap";

const DELIVERY_FEE = 150;

const STEP_LABELS = ["Category", "Items", "Delivery", "Review", "Payment"];

const SAMPLE_PRODUCTS: Record<string, { name: string; price: number; unit: string }[]> = {
  seafood: [
    { name: "Grilled Tuna (500g)", price: 450, unit: "piece" },
    { name: "King Prawns (300g)", price: 680, unit: "pack" },
    { name: "Lobster (1kg)", price: 1200, unit: "piece" },
    { name: "Snapper Fish (1kg)", price: 380, unit: "piece" },
    { name: "Squid (500g)", price: 320, unit: "pack" },
  ],
  groceries: [
    { name: "Unga wa Ugali (2kg)", price: 120, unit: "bag" },
    { name: "Sugar (1kg)", price: 160, unit: "bag" },
    { name: "Rice (2kg)", price: 220, unit: "bag" },
    { name: "Cooking Oil (1L)", price: 280, unit: "bottle" },
    { name: "Milk (500ml)", price: 65, unit: "packet" },
  ],
  fruits_veg: [
    { name: "Tomatoes (500g)", price: 80, unit: "kg" },
    { name: "Onions (1kg)", price: 90, unit: "kg" },
    { name: "Mangoes (x4)", price: 150, unit: "piece" },
    { name: "Coconut (x2)", price: 100, unit: "piece" },
    { name: "Spinach (bunch)", price: 50, unit: "bunch" },
  ],
  household: [
    { name: "Soap (Lifebuoy)", price: 60, unit: "bar" },
    { name: "Omo Washing Powder (500g)", price: 120, unit: "pack" },
    { name: "Toilet Paper (4-pack)", price: 180, unit: "pack" },
    { name: "Charcoal (5kg)", price: 200, unit: "sack" },
    { name: "Matchbox (x5)", price: 30, unit: "pack" },
  ],
};

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { step, category, items, deliveryAddress, paymentMethod, phone, notes,
    setStep, setCategory, setItems, setDelivery, setPayment, setNotes, reset } = useOrderStore();

  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [mpesaLoading, setMpesaLoading] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  function handleSelectCategory(id: string) {
    setCategory(id);
    setStep(2);
  }

  function handleQtyChange(name: string, price: number, qty: number) {
    setSelectedQty((prev) => ({ ...prev, [name]: Math.max(0, qty) }));
  }

  function handleAddItems() {
    const products = SAMPLE_PRODUCTS[category] ?? [];
    const newItems = products
      .filter((p) => (selectedQty[p.name] ?? 0) > 0)
      .map((p) => ({ name: p.name, quantity: selectedQty[p.name]!, price: p.price }));

    if (newItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setItems(newItems);
    setStep(3);
  }

  async function handlePayment() {
    if (paymentMethod === "mpesa") {
      setMpesaLoading(true);
      try {
        const res = await fetch("/api/payments/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: toMpesaPhone(phone || user?.phone || ""),
            amount: total,
            orderId: `OT-${Date.now()}`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Check your phone for the M-Pesa prompt!");
          reset();
          router.push("/dashboard/orders");
        } else {
          toast.error(data.message || "Payment failed");
        }
      } catch {
        toast.error("Payment request failed. Try again.");
      } finally {
        setMpesaLoading(false);
      }
    } else {
      toast.success("Order placed! Pay cash on delivery.");
      reset();
      router.push("/dashboard/orders");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                s < step ? "bg-green-100 text-green-700" :
                s === step ? "bg-orange text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {s < step ? <Check className="w-3.5 h-3.5" /> : (
                  <span className="text-xs font-outfit font-bold w-3.5 text-center">{s}</span>
                )}
                <span className="font-josefin text-xs font-semibold">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        {/* Step 1 — Category */}
        {step === 1 && (
          <div>
            <h2 className="font-outfit font-bold text-xl text-navy mb-1">What do you need?</h2>
            <p className="font-josefin text-gray-500 text-sm mb-6">Choose a service category to start your order.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-orange hover:bg-orange-50 transition-all duration-200 text-left group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <div>
                    <p className="font-outfit font-bold text-navy text-sm">{cat.label}</p>
                    <p className="font-josefin text-gray-400 text-xs">{cat.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange ml-auto" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Items */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="p-2 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <div>
                <h2 className="font-outfit font-bold text-xl text-navy">Select Items</h2>
                <p className="font-josefin text-gray-400 text-xs">
                  {SERVICE_CATEGORIES.find((c) => c.id === category)?.label}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {(SAMPLE_PRODUCTS[category] ?? []).map((product) => (
                <div key={product.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                  <div>
                    <p className="font-josefin font-semibold text-navy text-sm">{product.name}</p>
                    <p className="font-outfit font-bold text-orange text-sm">{formatKES(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-navy"
                      onClick={() => handleQtyChange(product.name, product.price, (selectedQty[product.name] ?? 0) - 1)}
                    >
                      -
                    </button>
                    <span className="font-outfit font-bold text-navy w-5 text-center text-sm">
                      {selectedQty[product.name] ?? 0}
                    </span>
                    <button
                      className="w-7 h-7 rounded-lg bg-orange text-white hover:bg-orange-600 flex items-center justify-center font-bold"
                      onClick={() => handleQtyChange(product.name, product.price, (selectedQty[product.name] ?? 0) + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="label">Special Notes (optional)</label>
              <textarea
                className="input-field resize-none h-20"
                placeholder="Any special requests or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button variant="primary" size="md" className="w-full mt-4" onClick={handleAddItems}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 3 — Delivery */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(2)} className="p-2 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <h2 className="font-outfit font-bold text-xl text-navy">Delivery Address</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Pin your location on the map</label>
                <p className="font-josefin text-gray-400 text-xs mb-2">Tap "Use my location" or tap anywhere on the map to pin your delivery spot.</p>
                <GoogleMapComponent
                  pickMode
                  height="h-56"
                  className="mb-3 border border-gray-100"
                  onLocationPicked={(coords, address) => {
                    setDelivery(address, coords.lat, coords.lng);
                  }}
                />
              </div>
              <div>
                <label className="label">Delivery Address</label>
                <textarea
                  className="input-field resize-none h-20"
                  placeholder="e.g., Near the old fort, behind Petley's Inn, Lamu Town — or pin on map above"
                  value={deliveryAddress}
                  onChange={(e) => setDelivery(e.target.value)}
                />
              </div>

              <div className="bg-navy-50 rounded-2xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-josefin font-semibold text-navy text-sm">Google Maps pin drop</p>
                  <p className="font-josefin text-gray-500 text-xs mt-1">
                    GPS pin-drop integration available. Enter your address above and our rider will call you for exact location.
                  </p>
                </div>
              </div>

              {user?.phone && (
                <p className="font-josefin text-gray-500 text-xs">
                  Rider will contact you on: <strong className="text-navy">{user.phone}</strong>
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-6"
              onClick={() => {
                if (!deliveryAddress) return toast.error("Enter a delivery address");
                setStep(4);
              }}
            >
              Review Order <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(3)} className="p-2 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <h2 className="font-outfit font-bold text-xl text-navy">Order Review</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="font-outfit font-semibold text-navy text-sm mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Items
                </p>
                {items.map((item) => (
                  <div key={item.name} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-josefin text-sm text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-outfit font-semibold text-navy text-sm">{formatKES(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="font-outfit font-semibold text-navy text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery
                </p>
                <p className="font-josefin text-gray-600 text-sm">{deliveryAddress}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-josefin text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span>{formatKES(subtotal)}</span>
                </div>
                <div className="flex justify-between font-josefin text-gray-500 text-sm">
                  <span>Delivery Fee</span>
                  <span>{formatKES(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between font-outfit font-bold text-navy text-lg border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatKES(total)}</span>
                </div>
              </div>
            </div>

            <Button variant="primary" size="md" className="w-full mt-6" onClick={() => setStep(5)}>
              Proceed to Payment <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 5 — Payment */}
        {step === 5 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(4)} className="p-2 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <h2 className="font-outfit font-bold text-xl text-navy">Payment</h2>
            </div>

            <div className="space-y-4">
              {/* Payment Method Toggle */}
              <div className="grid grid-cols-2 gap-3">
                {(["mpesa", "cash"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPayment(method, phone)}
                    className={`p-4 border-2 rounded-2xl text-center transition-all ${
                      paymentMethod === method
                        ? "border-orange bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{method === "mpesa" ? "📱" : "💵"}</div>
                    <p className="font-outfit font-bold text-navy text-sm">
                      {method === "mpesa" ? "M-Pesa" : "Cash on Delivery"}
                    </p>
                    <p className="font-josefin text-gray-400 text-xs mt-0.5">
                      {method === "mpesa" ? "STK Push to your phone" : "Pay when delivered"}
                    </p>
                  </button>
                ))}
              </div>

              {paymentMethod === "mpesa" && (
                <Input
                  label="M-Pesa Phone Number"
                  type="tel"
                  placeholder="0712 345 678"
                  defaultValue={user?.phone}
                  onChange={(e) => setPayment("mpesa", e.target.value)}
                />
              )}

              <div className="bg-orange-50 rounded-2xl p-4">
                <div className="flex justify-between font-outfit font-bold text-navy text-xl">
                  <span>Total to Pay</span>
                  <span className="text-orange">{formatKES(total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={mpesaLoading}
                onClick={handlePayment}
              >
                <CreditCard className="w-4 h-4" />
                {paymentMethod === "mpesa" ? "Pay with M-Pesa" : "Place Order (Cash)"}
              </Button>

              {paymentMethod === "mpesa" && (
                <p className="font-josefin text-gray-400 text-xs text-center">
                  You will receive an M-Pesa prompt on your phone. Enter your PIN to confirm.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
