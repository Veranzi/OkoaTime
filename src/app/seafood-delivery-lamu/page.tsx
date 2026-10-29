import ServiceLandingPage from "@/components/seo/ServiceLandingPage";
import { SEO_PAGES, seoMetadata } from "@/lib/seo-pages";

export const metadata = seoMetadata("seafood-delivery-lamu");

export default function Page() {
  return <ServiceLandingPage page={SEO_PAGES["seafood-delivery-lamu"]} />;
}
