import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OkoaTime — On-Demand Delivery in Lamu",
    short_name: "OkoaTime",
    description:
      "On-demand delivery for Lamu, Shela & Manda Islands. Order seafood, groceries and household items, book boat transport and pay with M-Pesa.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#001F5B",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
