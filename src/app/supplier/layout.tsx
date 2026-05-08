import PortalLayout from "@/components/layout/PortalLayout";

export const dynamic = 'force-dynamic';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="supplier">{children}</PortalLayout>;
}
