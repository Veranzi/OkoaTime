import ServiceLandingPage from "@/components/seo/ServiceLandingPage";
import { SEO_PAGES, seoMetadata } from "@/lib/seo-pages";

export const metadata = seoMetadata("sell-on-okoatime");

export default function Page() {
  return <ServiceLandingPage page={SEO_PAGES["sell-on-okoatime"]} />;
}
