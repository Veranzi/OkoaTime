import PortalLayout from "@/components/layout/PortalLayout";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

// Logged-in portal pages must never appear in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="customer">{children}</PortalLayout>;
}
