"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, MapPin, ShoppingCart, CreditCard, RefreshCw, Search, ImageIcon } from "lucide-react";
import { SERVICE_CATEGORIES, formatKES, toMpesaPhone } from "@/lib/utils";
import { useOrderStore } from "@/lib/store/useOrderStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { createOrder, updateOrder, getAvailableProducts } from "@/lib/firebase/db";
import type { Product } from "@/lib/firebase/db";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import GoogleMapComponent from "@/components/ui/GoogleMap";

const DELIVERY_FEE = 150;

const STEP_LABELS = ["Shop", "Delivery", "Review", "Payment"];

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
  const [search, setSearch] = useState("");

  // Real products from Firestore
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Payment confirmation state
  type PaymentStatus = "idle" | "sending" | "awaiting" | "confirmed" | "failed" | "timeout";
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [orderDocId, setOrderDocId] = useState("");
  const [mpesaReceipt, setMpesaReceipt] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [countdown, setCountdown] = useState(90);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getAvailableProducts()
      .then(setAllProducts)
      .catch(() => toast.error("Could not load products"))
      .finally(() => setProductsLoading(false));
  }, []);

  // Poll payment status every 3 s while awaiting confirmation
  useEffect(() => {
    if (paymentStatus !== "awaiting" || !checkoutRequestId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/mpesa/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await res.json() as { status: string; mpesaReceiptNumber?: string; failureReason?: string };
        if (data.status === "completed") {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          setMpesaReceipt(data.mpesaReceiptNumber ?? "");
          setPaymentStatus("confirmed");
          if (orderDocId) {
            updateOrder(orderDocId, { paymentStatus: "paid" }).catch(() => {});
          }
          setTimeout(() => { reset(); router.push("/dashboard/orders"); }, 3500);
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          setFailureReason(data.failureReason ?? "Payment was cancelled or failed");
          setPaymentStatus("failed");
        }
      } catch { /* network hiccup — keep polling */ }
    }, 3000);

    return () => clearInterval(pollRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, checkoutRequestId]);

  // 90-second countdown timer while awaiting
  useEffect(() => {
    if (paymentStatus !== "awaiting") return;
    setCountdown(90);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          clearInterval(pollRef.current!);
          setPaymentStatus("timeout");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const cartItemCount = Object.values(selectedQty).reduce((s, q) => s + q, 0);
  const cartSubtotal = allProducts.reduce(
    (s, p) => s + (selectedQty[p.name] ?? 0) * p.price,
    0
  );

  // Filter products by search and category tab
  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeFilter === "all" || p.category === activeFilter;
    return matchSearch && matchCat;
  });

  // Group filtered products into sections
  const sectionsToShow = (() => {
    if (activeFilter !== "all") {
      return [{
        catId: activeFilter,
        catLabel: SERVICE_CATEGORIES.find((c) => c.id === activeFilter)?.label ?? activeFilter,
        catIcon: SERVICE_CATEGORIES.find((c) => c.id === activeFilter)?.icon ?? "📦",
        products: filteredProducts,
      }];
    }
    const grouped: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return Object.entries(grouped).map(([catId, products]) => ({
      catId,
      catLabel: SERVICE_CATEGORIES.find((c) => c.id === catId)?.label ?? catId,
      catIcon: SERVICE_CATEGORIES.find((c) => c.id === catId)?.icon ?? "📦",
      products,
    }));
  })();

  const filterTabs = [
    { id: "all", label: "All", icon: "🛍️" },
    ...SERVICE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ];

  function openBrowse(filter: string, initialSearch = "") {
    setActiveFilter(filter);
    setSearch(initialSearch);
    setBrowsing(true);
  }

  function handleQtyChange(name: string, qty: number) {
    setSelectedQty((prev) => ({ ...prev, [name]: Math.max(0, qty) }));
  }

  function handleAddItems() {
    const selected = allProducts.filter((p) => (selectedQty[p.name] ?? 0) > 0);
    if (selected.length === 0) {
      toast.error("Add at least one item to continue");
      return;
    }
    const newItems = selected.map((p) => ({
      name: p.name,
      quantity: selectedQty[p.name]!,
      price: p.price,
    }));

    const cats = Array.from(new Set(selected.map((p) => p.category)));
    const supplierIds = Array.from(new Set(selected.map((p) => p.supplierId)));

    const { setCategory, setSupplier } = useOrderStore.getState();
    setCategory(cats.length === 1 ? cats[0] : "mixed");
    setSupplier(
      supplierIds.length === 1 ? supplierIds[0] : "",
      supplierIds.length === 1 ? (selected[0].supplierName ?? "") : ""
    );
    setItems(newItems);
    setStep(2);
    setBrowsing(false);
  }

  async function handlePayment() {
    const { category, supplierId, supplierName } = useOrderStore.getState();
    const orderData = {
      customerId: user?.uid ?? "",
      customerName: user?.name ?? "",
      customerPhone: user?.phone ?? "",
      category: category || "mixed",
      items,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
      deliveryAddress,
      paymentMethod,
      paymentStatus: "pending" as const,
      status: "pending" as const,
      notes: notes || undefined,
      ...(supplierId ? { supplierId, supplierName } : {}),
    };

    if (paymentMethod === "cash") {
      try {
        await createOrder(orderData);
        toast.success("Order placed! Pay cash on delivery.");
        reset();
        router.push("/dashboard/orders");
      } catch {
        toast.error("Failed to place order. Try again.");
      }
      return;
    }

    // M-Pesa flow
    setPaymentStatus("sending");
    try {
      const docId = await createOrder(orderData);
      setOrderDocId(docId);

      const res = await fetch("/api/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: toMpesaPhone(phone || user?.phone || ""),
          amount: total,
          orderId: docId,
        }),
      });
      const data = await res.json() as { success: boolean; checkoutRequestId?: string; message?: string };
      if (data.success && data.checkoutRequestId) {
        setCheckoutRequestId(data.checkoutRequestId);
        setPaymentStatus("awaiting");
      } else {
        setPaymentStatus("idle");
        toast.error(data.message || "Failed to send M-Pesa prompt. Try again.");
      }
    } catch {
      setPaymentStatus("idle");
      toast.error("Network error. Please try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                s < step ? "bg-green-100 text-green-700" :
                s === step ? "bg-orange text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {s < step ? (
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
            <p className="font-josefin text-gray-500 text-sm mb-4">
              Search for a product or browse by category.
            </p>

            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="input-field pl-10"
                placeholder="Search products... e.g. tuna, rice, soap"
                onFocus={() => openBrowse("all", "")}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!browsing) openBrowse("all", e.target.value);
                }}
              />
            </div>

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
            <div className="flex items-center gap-3 p-5 pb-3 border-b border-gray-100">
              <button
                onClick={() => { setBrowsing(false); setSearch(""); }}
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

            {/* Search bar */}
            <div className="relative px-5 pt-3">
              <Search className="absolute left-8 top-1/2 mt-1.5 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="input-field pl-10"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus={!!search}
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-gray-100">
              {filterTabs.map((tab) => (
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
              {productsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : sectionsToShow.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="font-outfit font-bold text-navy text-sm">No products found</p>
                  <p className="font-josefin text-gray-400 text-xs mt-1">
                    {search ? <>No results for &ldquo;{search}&rdquo;</> : "No products available in this category"}
                  </p>
                </div>
              ) : (
                sectionsToShow.map((section) => (
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
                            key={product.id}
                            className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${
                              qty > 0 ? "border-orange/40 bg-orange-50/40" : "border-gray-100"
                            }`}
                          >
                            {/* Product thumbnail */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                              {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-josefin font-semibold text-navy text-sm truncate">
                                {product.name}
                              </p>
                              <p className="font-outfit font-bold text-orange text-sm">
                                {formatKES(product.price)}
                                <span className="font-josefin font-normal text-gray-400 text-xs ml-1">/{product.unit}</span>
                              </p>
                              {product.supplierName && (
                                <p className="font-josefin text-gray-400 text-xs truncate">{product.supplierName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
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
                ))
              )}

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
                  Tap &ldquo;Use my location&rdquo; or tap the map to pin your delivery spot.
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

            {/* ── Payment confirmed ── */}
            {paymentStatus === "confirmed" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="font-outfit font-black text-2xl text-navy mb-1">Payment Confirmed!</h2>
                <p className="font-josefin text-gray-500 text-sm mb-4">
                  Your order has been placed and is being prepared.
                </p>
                {mpesaReceipt && (
                  <div className="bg-green-50 rounded-2xl p-4 mb-4 text-left">
                    <p className="font-josefin text-xs text-gray-400 mb-1">M-Pesa Receipt</p>
                    <p className="font-outfit font-bold text-navy text-lg tracking-wider">{mpesaReceipt}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex justify-between font-outfit font-bold text-navy">
                    <span>Amount Paid</span>
                    <span className="text-green-600">{formatKES(total)}</span>
                  </div>
                </div>
                <p className="font-josefin text-gray-400 text-xs mt-4 animate-pulse">
                  Redirecting to your orders...
                </p>
              </div>
            )}

            {/* ── Awaiting M-Pesa PIN ── */}
            {(paymentStatus === "awaiting" || paymentStatus === "sending") && (
              <div className="text-center py-8">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-orange/20 border-t-orange animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-3xl">📱</span>
                </div>
                <h2 className="font-outfit font-black text-xl text-navy mb-2">
                  {paymentStatus === "sending" ? "Sending M-Pesa Prompt…" : "Waiting for Your PIN"}
                </h2>
                <p className="font-josefin text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  {paymentStatus === "sending"
                    ? "Connecting to Safaricom…"
                    : "Check your phone and enter your M-Pesa PIN to confirm the payment."}
                </p>

                {paymentStatus === "awaiting" && (
                  <>
                    <div className="bg-orange-50 rounded-2xl p-4 mb-4">
                      <div className="flex justify-between font-outfit font-bold text-navy text-lg">
                        <span>Amount</span>
                        <span className="text-orange">{formatKES(total)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15.9"
                            fill="none"
                            stroke={countdown <= 20 ? "#E07B00" : "#0096B4"}
                            strokeWidth="3"
                            strokeDasharray={`${(countdown / 90) * 100} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-outfit font-bold text-xs text-navy">
                          {countdown}s
                        </span>
                      </div>
                      <p className="font-josefin text-gray-400 text-sm">
                        {countdown <= 20 ? "Timing out soon…" : "Waiting for confirmation"}
                      </p>
                    </div>

                    <p className="font-josefin text-gray-400 text-xs">
                      Didn&apos;t get a prompt?{" "}
                      <button
                        className="text-teal font-semibold hover:text-navy transition-colors"
                        onClick={() => { setPaymentStatus("idle"); }}
                      >
                        Try again
                      </button>
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── Payment failed / cancelled ── */}
            {(paymentStatus === "failed" || paymentStatus === "timeout") && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">
                    {paymentStatus === "timeout" ? "⏰" : "❌"}
                  </span>
                </div>
                <h2 className="font-outfit font-black text-xl text-navy mb-2">
                  {paymentStatus === "timeout" ? "Request Timed Out" : "Payment Not Completed"}
                </h2>
                <p className="font-josefin text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  {paymentStatus === "timeout"
                    ? "No confirmation received within 90 seconds."
                    : failureReason || "The M-Pesa payment was cancelled or failed."}
                </p>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => setPaymentStatus("idle")}
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => setPayment("cash", phone)}
                  >
                    💵 Switch to Cash on Delivery
                  </Button>
                </div>
              </div>
            )}

            {/* ── Payment method selection (idle) ── */}
            {paymentStatus === "idle" && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
