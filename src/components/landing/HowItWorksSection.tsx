import Link from "next/link";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: "📱",
    title: "Browse & Order",
    description: "Choose your service, add items, enter your delivery address, and pay securely via M-Pesa.",
    color: "bg-teal-50 border-teal/20",
    numberColor: "text-teal",
  },
  {
    step: "02",
    icon: "🛵",
    title: "Rider Picks Up",
    description: "A nearby rider accepts your order, heads to the supplier, and picks up your items.",
    color: "bg-orange-50 border-orange/20",
    numberColor: "text-orange",
  },
  {
    step: "03",
    icon: "📍",
    title: "Delivered To You",
    description: "Track your order live on the map. Get real-time updates until it arrives at your door.",
    color: "bg-navy-50 border-navy/20",
    numberColor: "text-navy",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-orange font-josefin font-semibold uppercase tracking-wider text-sm mb-3">Simple & Fast</p>
          <h2 className="section-title mb-4">How It Works</h2>
          <p className="text-gray-500 font-josefin max-w-xl mx-auto">
            Three simple steps between you and your delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-teal via-orange to-navy" />

          {steps.map((step, i) => (
            <div key={step.step} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -right-4 z-10 w-8">
                  <ArrowRight className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className={`border-2 ${step.color} rounded-2xl p-8 text-center hover:shadow-card transition-shadow duration-300`}>
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className={`font-outfit font-black text-5xl ${step.numberColor} opacity-20 mb-2`}>
                  {step.step}
                </div>
                <h3 className="font-outfit font-bold text-xl text-navy mb-3">{step.title}</h3>
                <p className="font-josefin text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/register">
            <Button size="lg" variant="primary">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
