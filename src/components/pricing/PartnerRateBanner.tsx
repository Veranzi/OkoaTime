import { Percent, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { PlatformRates } from "@/lib/utils";

type Role = "supplier" | "rider" | "boat";

function lines(role: Role, r: PlatformRates): string[] {
  if (role === "supplier") return [`OkoaTime commission: ${r.commissionRate}% of the item price`];
  if (role === "rider") return [
    `You earn ${r.riderShare}% of the delivery fee on bike deliveries`,
    `${r.riderShareHandoff}% when you hand an order to a boat at the jetty`,
  ];
  return [
    `You earn ${r.boatShare}% of the delivery fee on boat deliveries`,
    `${r.boatShareHandoff}% for the boat leg of a bike + boat delivery`,
  ];
}

/** Tells a partner which admin-set rates apply to them right now. */
export default function PartnerRateBanner({
  role,
  rates,
  promo,
  loaded,
}: {
  role: Role;
  rates: PlatformRates;
  promo: { name: string; endsAt: string | null } | null;
  loaded: boolean;
}) {
  if (!loaded) return null;
  return (
    <div className={`rounded-2xl p-4 mb-6 text-sm font-josefin flex items-start gap-2 ${promo ? "bg-orange-50 text-orange-800" : "bg-navy-50 text-gray-600"}`}>
      {promo ? <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange" /> : <Percent className="w-4 h-4 flex-shrink-0 mt-0.5 text-navy" />}
      <div>
        {promo && (
          <p className="font-semibold mb-1">
            Special rate: {promo.name}{promo.endsAt ? ` — until ${formatDate(new Date(promo.endsAt))}` : ""}
          </p>
        )}
        {lines(role, rates).map((l) => <p key={l}>{l}</p>)}
        <p className="text-xs opacity-70 mt-1">Rates are set by OkoaTime and can change; the rate on each order is fixed when the order is accepted.</p>
      </div>
    </div>
  );
}
