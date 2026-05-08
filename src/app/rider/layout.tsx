import PortalLayout from "@/components/layout/PortalLayout";

export const dynamic = 'force-dynamic';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="rider">{children}</PortalLayout>;
}
