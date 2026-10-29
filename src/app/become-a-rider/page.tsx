import ServiceLandingPage from "@/components/seo/ServiceLandingPage";
import { SEO_PAGES, seoMetadata } from "@/lib/seo-pages";

export const metadata = seoMetadata("become-a-rider");

export default function Page() {
  return <ServiceLandingPage page={SEO_PAGES["become-a-rider"]} />;
}
