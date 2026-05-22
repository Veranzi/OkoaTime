import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Privacy Policy — OkoaTime" };

const sections = [
  {
    title: "1. Introduction",
    body: `OkoaTime ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data when you use our platform across Lamu, Shela, Manda Island, and surrounding areas.`,
  },
  {
    title: "2. Information We Collect",
    items: [
      "Account information: your name, email address, and phone number when you register.",
      "Order information: items ordered, delivery address, and payment details.",
      "Location data: your delivery address and, where enabled, approximate GPS location for tracking.",
      "Payment information: M-Pesa transaction references (we do not store your M-Pesa PIN or full financial credentials).",
      "Usage data: pages visited, features used, and device/browser information for improving the platform.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    items: [
      "To process and fulfill your orders and deliveries.",
      "To communicate order status, updates, and support.",
      "To calculate and process payouts to suppliers, riders, and boat operators.",
      "To improve our platform, features, and customer experience.",
      "To comply with legal obligations under Kenyan law.",
    ],
  },
  {
    title: "4. Sharing Your Information",
    body: `We share your information only as necessary to deliver our service:`,
    items: [
      "With suppliers: your name, delivery address, and order details so they can prepare your order.",
      "With riders and boat operators: your name, phone number, and delivery address for delivery purposes.",
      "With Safaricom: payment information is shared with Safaricom to process M-Pesa transactions.",
      "With Firebase (Google): we use Google Firebase to store data and authenticate users securely.",
      "We do not sell, rent, or share your personal data with third-party advertisers.",
    ],
  },
  {
    title: "5. Data Storage & Security",
    body: `Your data is stored securely on Google Firebase servers with industry-standard encryption. We implement access controls so that each user can only access their own data. Admin access is restricted to authorised OkoaTime staff only. While we take reasonable precautions, no system is completely secure and we cannot guarantee absolute security.`,
  },
  {
    title: "6. Location Data",
    body: `Location data (GPS coordinates) is used only to facilitate real-time order tracking and accurate delivery. Rider and boat operator locations are shared with the relevant customer only while an order is active. We do not retain GPS location history beyond the completion of an order.`,
  },
  {
    title: "7. Cookies & Local Storage",
    body: `OkoaTime uses browser cookies and local storage to maintain your login session across visits. These are essential for the platform to function and cannot be disabled without logging out. We do not use third-party tracking cookies or advertising cookies.`,
  },
  {
    title: "8. Your Rights",
    items: [
      "Access: you may request a copy of the personal data we hold about you.",
      "Correction: you may update your profile information at any time within the app.",
      "Deletion: you may request deletion of your account and associated data by contacting us.",
      "Portability: you may request your data in a portable format.",
    ],
  },
  {
    title: "9. Children's Privacy",
    body: `OkoaTime is not intended for children under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us so we can remove it.`,
  },
  {
    title: "10. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated policy on this page with a revised date. Continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "11. Contact Us",
    body: `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us via WhatsApp or call +254 707 132 823 or +254 740 875 071.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Image src="/okoatiimelogoo.png" alt="OkoaTime" width={36} height={36} className="rounded-xl" />
            <span className="font-outfit font-bold text-white text-lg">Okoa<span className="text-orange">Time</span></span>
          </Link>
          <h1 className="font-outfit font-black text-white text-3xl sm:text-4xl mb-2">Privacy Policy</h1>
          <p className="font-josefin text-gray-300 text-sm">Last updated: May 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-outfit font-bold text-navy text-lg mb-3">{s.title}</h2>
              {s.body && (
                <p className="font-josefin text-gray-600 leading-relaxed mb-2">{s.body}</p>
              )}
              {s.items && (
                <ul className="space-y-2">
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
          <Link href="/terms" className="hover:text-navy transition-colors">Terms of Service</Link>
          <Link href="/return-policy" className="hover:text-navy transition-colors">Return Policy</Link>
          <Link href="/" className="hover:text-navy transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
