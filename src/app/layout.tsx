import type { Metadata } from "next";
import { Outfit, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OkoaTime — Saving Time, Delivering Convenience.",
  description:
    "On-demand delivery platform for Lamu, Shela & Manda Islands. Order seafood, groceries, household items and book boat transport.",
  keywords: ["delivery", "Lamu", "Kenya", "on-demand", "seafood", "M-Pesa"],
  openGraph: {
    title: "OkoaTime",
    description: "Saving Time, Delivering Convenience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${josefinSans.variable}`}>
      <body className="font-josefin antialiased bg-white text-navy">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-josefin)",
              borderRadius: "12px",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#0096B4", secondary: "#fff" } },
            error: { iconTheme: { primary: "#E07B00", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
