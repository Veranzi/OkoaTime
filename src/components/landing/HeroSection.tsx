import Link from "next/link";
import Button from "@/components/ui/Button";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 right-10 w-32 h-32 bg-orange/20 rounded-full blur-2xl animate-pulse-soft" />
      <div className="absolute bottom-1/3 left-10 w-48 h-48 bg-teal/20 rounded-full blur-3xl animate-pulse-soft" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-josefin px-4 py-2 rounded-full border border-white/20 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now serving Lamu, Shela & Manda Islands
            </div>

            <h1 className="font-outfit font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-4">
              Order Anything.{" "}
              <span className="text-orange">Delivered Fast.</span>
            </h1>

            <p className="font-josefin text-lg text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
              Saving Time, Delivering Convenience. Fresh seafood, groceries, household items
              and boat transport — all at your fingertips.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/dashboard/order/new">
                <Button size="lg" variant="primary" className="w-full sm:w-auto">
                  Order Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-navy">
                  <Play className="w-4 h-4" />
                  How It Works
                </Button>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 mt-8 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-white/70 text-sm font-josefin">
                <span className="text-green-400">✓</span> M-Pesa Payments
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm font-josefin">
                <span className="text-green-400">✓</span> Live GPS Tracking
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm font-josefin">
                <span className="text-green-400">✓</span> 30-60 Min Delivery
              </div>
            </div>
          </div>

          {/* Right — Order Card Preview */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 w-full max-w-sm shadow-2xl animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🐟</span>
                </div>
                <div>
                  <p className="font-outfit font-bold text-white">Seafood Delivery</p>
                  <p className="text-white/60 text-sm font-josefin">Fresh from the ocean daily</p>
                </div>
              </div>

              {[
                { name: "Grilled Tuna (500g)", price: "KES 450", qty: "x2" },
                { name: "King Prawns (300g)", price: "KES 680", qty: "x1" },
                { name: "Lobster (1kg)", price: "KES 1,200", qty: "x1" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-2.5 border-b border-white/10">
                  <div>
                    <p className="text-white font-josefin text-sm">{item.name}</p>
                    <p className="text-white/60 text-xs">{item.qty}</p>
                  </div>
                  <p className="text-orange font-outfit font-semibold text-sm">{item.price}</p>
                </div>
              ))}

              <div className="mt-4 pt-2 flex items-center justify-between">
                <span className="text-white/70 font-josefin text-sm">Total</span>
                <span className="text-white font-outfit font-bold text-lg">KES 2,780</span>
              </div>

              <div className="mt-4 bg-orange rounded-2xl py-3 px-6 text-center">
                <p className="text-white font-outfit font-semibold text-sm">Pay with M-Pesa 📱</p>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-white/70 text-xs font-josefin">Rider assigned • ETA 25 mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Icons Row */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { icon: "🐟", label: "Seafood" },
            { icon: "🛒", label: "Shopping" },
            { icon: "🥦", label: "Fruits & Veg" },
            { icon: "🏠", label: "Household" },
            { icon: "⛵", label: "Boat" },
          ].map((item) => (
            <Link
              href="/dashboard/order/new"
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              <span className="font-josefin text-white/80 text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
