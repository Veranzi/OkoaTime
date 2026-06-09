import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Terms of Service — OkoaTime" };

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using the OkoaTime platform (website or mobile application), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. OkoaTime reserves the right to update these terms at any time, and continued use of the platform constitutes acceptance of the revised terms.`,
  },
  {
    title: "2. Our Service",
    body: `OkoaTime is a delivery platform operating across Lamu, Shela, Manda Island, and surrounding areas. We connect customers with local suppliers and facilitate the delivery of goods via motorcycle riders and boat operators. OkoaTime acts as an intermediary and is not directly responsible for the quality, safety, or legality of items listed by suppliers.`,
  },
  {
    title: "3. User Accounts",
    items: [
      "You must provide accurate, complete, and current information when registering.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You must notify us immediately of any unauthorized use of your account.",
      "You must be at least 18 years old to create an account.",
      "Accounts are personal and may not be transferred or sold.",
    ],
  },
  {
    title: "4. Ordering & Payment",
    items: [
      "Orders are confirmed only after successful payment or acceptance of a cash-on-delivery order.",
      "Prices displayed include all applicable charges unless otherwise stated.",
      "M-Pesa payments are processed securely via Safaricom's STK push.",
      "Cash on delivery is available for eligible orders and service areas.",
      "OkoaTime charges a 10% platform commission on item subtotals and retains 30% of delivery fees.",
    ],
  },
  {
    title: "5. Delivery",
    body: `Estimated delivery times are approximate and may vary due to distance, weather conditions (particularly across water routes), and order volume. OkoaTime will communicate any significant delays. Delivery is completed once the rider or boat operator marks the order as delivered and the customer receives the goods.`,
  },
  {
    title: "6. Cancellations & Refunds",
    body: `Orders may be cancelled before they are confirmed by the supplier. Once an order is being prepared or has been picked up, cancellations may not be possible. Refunds are handled according to our Return & Refund Policy. Please refer to our`,
    link: { href: "/return-policy", label: "Return & Refund Policy" },
    bodySuffix: " for full details.",
  },
  {
    title: "7. Supplier & Rider Obligations",
    items: [
      "Suppliers must ensure listed products are available, accurately described, and safe for consumption.",
      "Riders and boat operators must follow safe delivery practices and treat customers with respect.",
      "All partners are responsible for complying with applicable Kenyan laws and regulations.",
      "OkoaTime reserves the right to suspend or terminate any partner account for misconduct or policy violations.",
    ],
  },
  {
    title: "8. Prohibited Uses",
    items: [
      "Using the platform for any unlawful purpose or in violation of any local, national, or international law.",
      "Submitting false, misleading, or fraudulent orders or reviews.",
      "Attempting to gain unauthorized access to any part of the platform or its systems.",
      "Harassing, threatening, or abusing other users, suppliers, riders, or OkoaTime staff.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: `To the maximum extent permitted by law, OkoaTime shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including loss of data, profits, or goodwill. Our total liability to you for any claim shall not exceed the amount paid for the specific order giving rise to the claim.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms of Service are governed by and construed in accordance with the laws of Kenya. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Kenya.`,
  },
  {
    title: "11. Contact Us",
    body: `If you have any questions about these Terms of Service, please contact us via WhatsApp or call +254 707 132 823 or +254 740 875 071. You may also reach us through the OkoaTime app.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Image src="/okoatimereallogo.png" alt="OkoaTime" width={96} height={52} className="rounded-xl" />
            <span className="font-outfit font-bold text-white text-lg">Okoa<span className="text-orange">Time</span></span>
          </Link>
          <h1 className="font-outfit font-black text-white text-3xl sm:text-4xl mb-2">Terms of Service</h1>
          <p className="font-josefin text-navy-300 text-sm text-gray-300">Last updated: May 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-outfit font-bold text-navy text-lg mb-3">{s.title}</h2>
              {s.body && (
                <p className="font-josefin text-gray-600 leading-relaxed">
                  {s.body}
                  {s.link && <Link href={s.link.href} className="text-teal hover:text-navy font-semibold transition-colors"> {s.link.label}</Link>}
                  {s.bodySuffix}
                </p>
              )}
              {s.items && (
                <ul className="space-y-2 mt-2">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-2 font-josefin text-gray-600">
                      <span className="text-orange font-bold mt-0.5 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 font-josefin text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-navy transition-colors">Privacy Policy</Link>
          <Link href="/return-policy" className="hover:text-navy transition-colors">Return Policy</Link>
          <Link href="/" className="hover:text-navy transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
