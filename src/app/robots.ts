import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/return-policy"],
        disallow: [
          "/dashboard/",
          "/supplier/",
          "/rider/",
          "/boat/",
          "/admin/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://okoatime.avytria.com/sitemap.xml",
  };
}
