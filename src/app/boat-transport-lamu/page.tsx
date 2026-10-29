import ServiceLandingPage from "@/components/seo/ServiceLandingPage";
import { SEO_PAGES, seoMetadata } from "@/lib/seo-pages";

export const metadata = seoMetadata("boat-transport-lamu");

export default function Page() {
  return <ServiceLandingPage page={SEO_PAGES["boat-transport-lamu"]} />;
}
