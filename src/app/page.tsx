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

export default function HomePage() {
  return (
    <>
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
