import Link from "next/link";
import Button from "@/components/ui/Button";

const services = [
  {
    icon: "🐟",
    title: "Seafood Delivery",
    description: "Fresh fish, prawns, crabs, and lobster delivered straight from Lamu fishermen to your door.",
    color: "from-blue-50 to-teal-50",
    borderColor: "border-teal/30",
  },
  {
    icon: "🛒",
    title: "House Shopping",
    description: "Send us your shopping list. Our riders visit local shops and deliver everything you need.",
    color: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
  },
  {
    icon: "🥦",
    title: "Fruits & Vegetables",
    description: "Farm-fresh produce from local mama mbogas. Order daily and get the freshest picks.",
    color: "from-lime-50 to-green-50",
    borderColor: "border-lime-200",
  },
  {
    icon: "🏠",
    title: "Household Items",
    description: "Cleaning supplies, toiletries, electronics, and more from trusted local shops.",
    color: "from-purple-50 to-indigo-50",
    borderColor: "border-purple-200",
  },
  {
    icon: "⛵",
    title: "Boat Transport",
    description: "Book a boat for Lamu-Shela, Shela-Manda, or custom routes. Fast, reliable, and affordable.",
    color: "from-orange-50 to-amber-50",
    borderColor: "border-orange/30",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-orange font-josefin font-semibold uppercase tracking-wider text-sm mb-3">What We Deliver</p>
          <h2 className="section-title mb-4">Our Services</h2>
          <p className="text-gray-500 font-josefin max-w-xl mx-auto">
            Everything you need in Lamu — delivered to your doorstep in 30-60 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className={`bg-gradient-to-br ${service.color} border ${service.borderColor} rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 group`}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200 w-fit">
                {service.icon}
              </div>
              <h3 className="font-outfit font-bold text-xl text-navy mb-2">{service.title}</h3>
              <p className="font-josefin text-gray-600 text-sm leading-relaxed mb-4">
                {service.description}
              </p>
              <Link href="/dashboard/order/new">
                <Button size="sm" variant="secondary" className="w-full">
                  Order Now
                </Button>
              </Link>
            </div>
          ))}

          {/* CTA Card */}
          <div className="bg-navy rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="font-josefin text-orange text-sm font-semibold uppercase tracking-wider mb-2">
                Are you a supplier?
              </p>
              <h3 className="font-outfit font-bold text-xl text-white mb-2">
                Sell on OkoaTime
              </h3>
              <p className="font-josefin text-navy-200 text-sm leading-relaxed">
                Join 20+ local suppliers already earning more with our platform.
              </p>
            </div>
            <div className="mt-6">
              <Link href="/register">
                <Button size="sm" variant="primary" className="w-full">
                  Join as Supplier
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
