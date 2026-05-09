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

const STEP_LABELS = ["Shop", "Delivery", "Review", "Payment"];

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

const FILTER_TABS = [
  { id: "all", label: "All", icon: "🛍️" },
  ...SERVICE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
];

const ALL_PRODUCTS = Object.values(SAMPLE_PRODUCTS).flat();

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    step, items, deliveryAddress, paymentMethod, phone, notes,
    setStep, setItems, setDelivery, setPayment, setNotes, reset,
  } = useOrderStore();

  // Step 1 has two sub-views: entry (category picker) and browse (product list)
  const [browsing, setBrowsing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [mpesaLoading, setMpesaLoading] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const cartItemCount = Object.values(selectedQty).reduce((s, q) => s + q, 0);
  const cartSubtotal = ALL_PRODUCTS.reduce(
    (s, p) => s + (selectedQty[p.name] ?? 0) * p.price,
    0
  );

  const sectionsToShow =
    activeFilter === "all"
      ? Object.entries(SAMPLE_PRODUCTS).map(([catId, products]) => ({
          catId,
          catLabel: SERVICE_CATEGORIES.find((c) => c.id === catId)?.label ?? catId,
          catIcon: SERVICE_CATEGORIES.find((c) => c.id === catId)?.icon ?? "📦",
          products,
        }))
      : [
          {
            catId: activeFilter,
            catLabel: SERVICE_CATEGORIES.find((c) => c.id === activeFilter)?.label ?? activeFilter,
            catIcon: SERVICE_CATEGORIES.find((c) => c.id === activeFilter)?.icon ?? "📦",
            products: SAMPLE_PRODUCTS[activeFilter] ?? [],
          },
        ];

  function openBrowse(filter: string) {
    setActiveFilter(filter);
    setBrowsing(true);
  }

  function handleQtyChange(name: string, qty: number) {
    setSelectedQty((prev) => ({ ...prev, [name]: Math.max(0, qty) }));
  }

  function handleAddItems() {
    const newItems = ALL_PRODUCTS.filter((p) => (selectedQty[p.name] ?? 0) > 0).map((p) => ({
      name: p.name,
      quantity: selectedQty[p.name]!,
      price: p.price,
    }));
    if (newItems.length === 0) {
      toast.error("Add at least one item to continue");
      return;
    }
    setItems(newItems);
    setStep(2);
    setBrowsing(false);
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

  // step index for progress bar: browse mode counts as step 1
  const progressStep = step;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                s < progressStep ? "bg-green-100 text-green-700" :
                s === progressStep ? "bg-orange text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {s < progressStep ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-outfit font-bold w-3.5 text-center">{s}</span>
                )}
                <span className="font-josefin text-xs font-semibold">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-card">

        {/* ─── Step 1A: Category entry ─── */}
        {step === 1 && !browsing && (
          <div className="p-6">
            <h2 className="font-outfit font-bold text-xl text-navy mb-1">What do you need?</h2>
            <p className="font-josefin text-gray-500 text-sm mb-5">
              Browse all products or jump straight to a category.
            </p>

            {/* Browse All */}
            <button
              onClick={() => openBrowse("all")}
              className="w-full flex items-center gap-4 p-4 border-2 border-navy/20 rounded-2xl hover:border-navy hover:bg-gray-50 transition-all duration-200 text-left group mb-4"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🛍️</span>
              <div className="flex-1">
                <p className="font-outfit font-bold text-navy text-sm">Browse All Products</p>
                <p className="font-josefin text-gray-400 text-xs">Mix items from any category in one order</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-navy" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="font-josefin text-gray-400 text-xs">or jump to a category</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Category Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => openBrowse(cat.id)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-orange hover:bg-orange-50 transition-all duration-200 text-left group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="font-outfit font-bold text-navy text-sm">{cat.label}</p>
                    <p className="font-josefin text-gray-400 text-xs">{cat.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 1B: Product browser ─── */}
        {step === 1 && browsing && (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 p-5 pb-4 border-b border-gray-100">
              <button
                onClick={() => setBrowsing(false)}
                className="p-2 rounded-xl hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-outfit font-bold text-xl text-navy">Select Items</h2>
                <p className="font-josefin text-gray-400 text-xs">
                  {cartItemCount > 0
                    ? `${cartItemCount} item${cartItemCount > 1 ? "s" : ""} in cart · ${formatKES(cartSubtotal)}`
                    : "Add items to your order"}
                </p>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-gray-100">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-josefin font-semibold flex-shrink-0 transition-all ${
                    activeFilter === tab.id
                      ? "bg-orange text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="p-5 space-y-6 pb-28">
              {sectionsToShow.map((section) => (
                <div key={section.catId}>
                  {activeFilter === "all" && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{section.catIcon}</span>
                      <p className="font-outfit font-bold text-navy text-sm">{section.catLabel}</p>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}
                  <div className="space-y-2">
                    {section.products.map((product) => {
                      const qty = selectedQty[product.name] ?? 0;
                      return (
                        <div
                          key={product.name}
                          className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${
                            qty > 0 ? "border-orange/40 bg-orange-50/40" : "border-gray-100"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-josefin font-semibold text-navy text-sm truncate">
                              {product.name}
                            </p>
                            <p className="font-outfit font-bold text-orange text-sm">
                              {formatKES(product.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {qty > 0 ? (
                              <>
                                <button
                                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-navy text-base"
                                  onClick={() => handleQtyChange(product.name, qty - 1)}
                                >
                                  −
                                </button>
                                <span className="font-outfit font-bold text-navy w-5 text-center text-sm">
                                  {qty}
                                </span>
                                <button
                                  className="w-7 h-7 rounded-lg bg-orange text-white hover:bg-orange-600 flex items-center justify-center font-bold text-base"
                                  onClick={() => handleQtyChange(product.name, qty + 1)}
                                >
                                  +
                                </button>
                              </>
                            ) : (
                              <button
                                className="px-3 py-1.5 rounded-lg bg-orange text-white text-xs font-outfit font-bold hover:bg-orange-600 transition-colors"
                                onClick={() => handleQtyChange(product.name, 1)}
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div>
                <label className="label">Special Notes (optional)</label>
                <textarea
                  className="input-field resize-none h-20"
                  placeholder="Any special requests or instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Sticky Cart Bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-b-2xl">
              {cartItemCount > 0 ? (
                <Button variant="primary" size="md" className="w-full" onClick={handleAddItems}>
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount} item{cartItemCount > 1 ? "s" : ""} · {formatKES(cartSubtotal)} — Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <p className="text-center font-josefin text-gray-400 text-sm py-1">
                  Tap + Add on any item to get started
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 2: Delivery ─── */}
        {step === 2 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setStep(1); setBrowsing(true); }}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <h2 className="font-outfit font-bold text-xl text-navy">Delivery Address</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Pin your location on the map</label>
                <p className="font-josefin text-gray-400 text-xs mb-2">
                  Tap "Use my location" or tap the map to pin your delivery spot.
                </p>
                <GoogleMapComponent
                  pickMode
                  height="h-56"
                  className="mb-3 border border-gray-100"
                  onLocationPicked={(coords, address) => setDelivery(address, coords.lat, coords.lng)}
                />
              </div>
              <div>
                <label className="label">Delivery Address</label>
                <textarea
                  className="input-field resize-none h-20"
                  placeholder="e.g., Near the old fort, behind Petley's Inn, Lamu Town"
                  value={deliveryAddress}
                  onChange={(e) => setDelivery(e.target.value)}
                />
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-josefin font-semibold text-navy text-sm">GPS pin-drop available</p>
                  <p className="font-josefin text-gray-500 text-xs mt-1">
                    Use the map above to pin your exact location. Our rider will call you to confirm.
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
                setStep(3);
              }}
            >
              Review Order <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ─── Step 3: Review ─── */}
        {step === 3 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(2)} className="p-2 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <h2 className="font-outfit font-bold text-xl text-navy">Order Review</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="font-outfit font-semibold text-navy text-sm mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Items ({items.length})
                </p>
                {items.map((item) => (
                  <div key={item.name} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-josefin text-sm text-gray-700 truncate pr-3">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-outfit font-semibold text-navy text-sm flex-shrink-0">
                      {formatKES(item.price * item.quantity)}
                    </span>
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
                  <span>Subtotal</span><span>{formatKES(subtotal)}</span>
                </div>
                <div className="flex justify-between font-josefin text-gray-500 text-sm">
                  <span>Delivery Fee</span><span>{formatKES(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between font-outfit font-bold text-navy text-lg border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span><span>{formatKES(total)}</span>
                </div>
              </div>
            </div>

            <Button variant="primary" size="md" className="w-full mt-6" onClick={() => setStep(4)}>
              Proceed to Payment <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ─── Step 4: Payment ─── */}
        {step === 4 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(3)} className="p-2 rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <h2 className="font-outfit font-bold text-xl text-navy">Payment</h2>
            </div>

            <div className="space-y-4">
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
