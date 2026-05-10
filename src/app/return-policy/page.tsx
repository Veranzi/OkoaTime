import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Return & Refund Policy — OkoaTime" };

const sections = [
  {
    title: "1. Our Commitment",
    body: `At OkoaTime we take pride in delivering fresh, quality products to your doorstep across Lamu, Shela, and Manda Islands. If something is not right with your order, we will make it right — quickly and without hassle.`,
  },
  {
    title: "2. Eligible Issues",
    items: [
      "Wrong item delivered — you received a product different from what you ordered.",
      "Damaged or spoiled item — the product arrived in unacceptable condition.",
      "Missing item — part of your order was not delivered.",
      "Significantly short quantity — you received notably less than the quantity ordered.",
    ],
  },
  {
    title: "3. How to Report",
    body: `You must report any issue within 2 hours of delivery. Contact us via WhatsApp or call on +254 707 132 823 or +254 740 875 071. Please have your order reference number ready and, where possible, send a photo of the item in question. Reports made after 2 hours of delivery may not be eligible for a refund.`,
  },
  {
    title: "4. Resolution Options",
    items: [
      "Replacement — we will re-deliver the correct or undamaged item at no extra charge.",
      "Partial refund — a credit is applied to your next order for items that were short or substandard.",
      "Full refund — issued for entirely wrong or undeliverable orders, returned to your M-Pesa within 24 hours.",
    ],
  },
  {
    title: "5. Non-Refundable Situations",
    items: [
      "Change of mind after the order has been picked up by a rider.",
      "Incorrect delivery address provided by the customer.",
      "Perishable items that were accepted at delivery and consumed.",
      "Delays caused by circumstances outside our control (weather, ferry schedule, etc.).",
    ],
  },
  {
    title: "6. Cash on Delivery Orders",
    body: `For cash-on-delivery orders, you are entitled to inspect items before paying. If you are not satisfied with the condition of a product, you may refuse that specific item before payment and it will be returned to the supplier.`,
  },
  {
    title: "7. M-Pesa Refunds",
    body: `Approved M-Pesa refunds are processed within 24 hours of the resolution being confirmed. You will receive an M-Pesa notification once the reversal is complete. OkoaTime does not charge any fees for processing refunds.`,
  },
  {
    title: "8. Contact Us",
    body: `For any questions about this policy, reach us at:\n📞 +254 707 132 823\n📞 +254 740 875 071\n✉️ hello@okoatime.co.ke\n📍 Lamu Island, Kenya`,
  },
];

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy text-white py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/okoatiimelogoo.png" alt="OkoaTime" width={36} height={36} className="rounded-xl" />
            <span className="font-outfit font-bold text-lg">
              Okoa<span className="text-orange">Time</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="font-outfit font-black text-3xl text-navy mb-2">Return &amp; Refund Policy</h1>
          <p className="font-josefin text-gray-400 text-sm mb-8">
            Last updated: {new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-outfit font-bold text-lg text-navy mb-3">{section.title}</h2>
                {section.body && (
                  <p className="font-josefin text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                )}
                {section.items && (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 font-josefin text-gray-600 text-sm">
                        <span className="text-orange font-bold mt-0.5 flex-shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="font-josefin text-sm text-teal hover:text-navy transition-colors">
              ← Back to Home
            </Link>
            <div className="flex items-center gap-4 text-xs font-josefin text-gray-400">
              <Link href="/privacy" className="hover:text-navy transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-navy transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
