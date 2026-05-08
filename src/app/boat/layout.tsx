import PortalLayout from "@/components/layout/PortalLayout";

export const dynamic = 'force-dynamic';

export default function BoatLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="boat">{children}</PortalLayout>;
}
