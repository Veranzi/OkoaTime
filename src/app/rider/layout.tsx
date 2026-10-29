import PortalLayout from "@/components/layout/PortalLayout";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

// Logged-in portal pages must never appear in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="rider">{children}</PortalLayout>;
}
