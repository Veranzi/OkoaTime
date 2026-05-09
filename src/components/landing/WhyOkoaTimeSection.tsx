const benefits = [
  {
    icon: "⚡",
    title: "Fast Delivery",
    description: "30 to 60 minute delivery across Lamu Island, Shela, and Manda. We know the routes.",
    bgColor: "bg-yellow-50",
  },
  {
    icon: "📱",
    title: "M-Pesa Payments",
    description: "Pay securely via M-Pesa STK Push or cash on delivery. No card needed.",
    bgColor: "bg-green-50",
  },
  {
    icon: "🗺️",
    title: "Live GPS Tracking",
    description: "Watch your rider move in real-time on Google Maps. Know exactly when to expect your order.",
    bgColor: "bg-blue-50",
  },
  {
    icon: "🤝",
    title: "Local & Trusted",
    description: "All our suppliers and riders are vetted locals from Lamu. Supporting community businesses.",
    bgColor: "bg-orange-50",
  },
];

export default function WhyOkoaTimeSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <p className="text-orange font-josefin font-semibold uppercase tracking-wider text-sm mb-3">Why Choose Us</p>
            <h2 className="font-outfit font-black text-4xl text-navy mb-6 leading-tight">
              Built for Lamu.<br />Made for You.
            </h2>
            <p className="font-josefin text-gray-600 leading-relaxed mb-8">
              OkoaTime was built by people who understand island life. We know traffic doesn&apos;t exist here —
              boats do. We know M-Pesa is how you pay. We know fresh fish comes in at dawn. That local
              knowledge is our superpower.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div key={b.title} className={`${b.bgColor} rounded-2xl p-5`}>
                  <div className="text-3xl mb-3">{b.icon}</div>
                  <h3 className="font-outfit font-bold text-navy text-base mb-1">{b.title}</h3>
                  <p className="font-josefin text-gray-600 text-xs leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-navy to-teal rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                  📍
                </div>
                <div>
                  <p className="font-outfit font-bold">Live Tracking</p>
                  <p className="text-white/70 text-sm font-josefin">Your rider is on the way</p>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-white/10 rounded-2xl h-48 flex items-center justify-center mb-6 border border-white/20">
                <div className="text-center">
                  <div className="text-5xl mb-2">🗺️</div>
                  <p className="font-josefin text-white/80 text-sm">Google Maps Integration</p>
                  <p className="font-josefin text-white/50 text-xs">Real-time rider location</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Order Placed", status: "done", time: "2:30 PM" },
                  { label: "Rider Assigned", status: "done", time: "2:31 PM" },
                  { label: "Rider on the way", status: "active", time: "2:35 PM" },
                  { label: "Delivered", status: "pending", time: "~3:05 PM" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      item.status === "done" ? "bg-green-400" :
                      item.status === "active" ? "bg-orange animate-pulse" :
                      "bg-white/30"
                    }`} />
                    <span className="font-josefin text-white/80 text-sm flex-1">{item.label}</span>
                    <span className="font-josefin text-white/50 text-xs">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-orange text-white rounded-2xl px-4 py-2 shadow-orange">
              <p className="font-outfit font-bold text-sm">30-60 min</p>
              <p className="font-josefin text-xs text-orange-100">delivery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
