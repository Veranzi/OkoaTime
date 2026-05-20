import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import ServicesSection from "@/components/landing/ServicesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyOkoaTimeSection from "@/components/landing/WhyOkoaTimeSection";
import StatsBar from "@/components/landing/StatsBar";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import AppCTASection from "@/components/landing/AppCTASection";
import ContactSection from "@/components/landing/ContactSection";

export const metadata: Metadata = {
  title: "OkoaTime — On-Demand Delivery in Lamu, Kenya",
  description:
    "Fast delivery across Lamu Town, Shela, and Manda Island. Order fresh seafood, groceries, and household items. Pay via M-Pesa. Track your rider live on the map.",
  keywords: [
    "delivery Lamu", "Lamu delivery service", "Shela delivery", "Manda Island delivery",
    "M-Pesa delivery", "seafood delivery Lamu", "OkoaTime", "Kenya island delivery",
  ],
  alternates: { canonical: "https://okoatime.avytria.com" },
  openGraph: {
    title: "OkoaTime — On-Demand Delivery in Lamu, Kenya",
    description: "Fast delivery across Lamu, Shela & Manda. Pay with M-Pesa. Track live.",
    url: "https://okoatime.avytria.com",
    siteName: "OkoaTime",
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "OkoaTime — On-Demand Delivery in Lamu, Kenya",
    description: "Fast delivery across Lamu, Shela & Manda. Pay with M-Pesa. Track live.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://okoatime.avytria.com/#business",
      name: "OkoaTime",
      description: "On-demand delivery platform serving Lamu Town, Shela, and Manda Island, Kenya.",
      url: "https://okoatime.avytria.com",
      telephone: ["+254707132823", "+254740875071"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lamu",
        addressRegion: "Lamu County",
        addressCountry: "KE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -2.2694,
        longitude: 40.9023,
      },
      areaServed: [
        { "@type": "Place", name: "Lamu Town" },
        { "@type": "Place", name: "Shela" },
        { "@type": "Place", name: "Manda Island" },
      ],
      priceRange: "KES 100–400",
      openingHours: "Mo-Su 06:00-22:00",
      sameAs: [],
    },
    {
      "@type": "DeliveryService",
      name: "OkoaTime Delivery",
      provider: { "@id": "https://okoatime.avytria.com/#business" },
      areaServed: [
        { "@type": "Place", name: "Lamu Town" },
        { "@type": "Place", name: "Shela" },
        { "@type": "Place", name: "Manda Island" },
      ],
      availableDeliveryMethod: [
        { "@type": "DeliveryMethod", name: "Bike Delivery" },
        { "@type": "DeliveryMethod", name: "Boat Delivery" },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <ServicesSection />
        <HowItWorksSection />
        <WhyOkoaTimeSection />
        <TestimonialsSection />
        <AppCTASection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
