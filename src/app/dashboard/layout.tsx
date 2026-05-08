import PortalLayout from "@/components/layout/PortalLayout";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="customer">{children}</PortalLayout>;
}
