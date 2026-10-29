import { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.okoatime.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...Object.keys(SEO_PAGES).map((slug) => ({
      url: `https://www.okoatime.com/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: "https://www.okoatime.com/return-policy",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://www.okoatime.com/privacy",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://www.okoatime.com/terms",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
