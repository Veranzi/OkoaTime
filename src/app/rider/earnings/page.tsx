"use client";
import { DollarSign, Package, TrendingUp, Star } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";

const deliveries = [
  { id: "OT-K3X2P", from: "Fatuma Fresh Fish", to: "Shela beach", payout: 120, date: new Date(Date.now() - 2 * 3600000) },
  { id: "OT-M1Y9Q", from: "Lamu Market", to: "Near old fort", payout: 80, date: new Date(Date.now() - 5 * 3600000) },
  { id: "OT-P5Z7R", from: "Mama Mboga", to: "Manda Island", payout: 150, date: new Date(Date.now() - 26 * 3600000) },
  { id: "OT-Q8W1N", from: "Lamu Supermart", to: "Shela village", payout: 100, date: new Date(Date.now() - 2 * 86400000) },
  { id: "OT-R2X3M", from: "Fatuma Fresh Fish", to: "Near old fort", payout: 90, date: new Date(Date.now() - 3 * 86400000) },
];

export default function RiderEarningsPage() {
  const today = deliveries.slice(0, 3).reduce((s, d) => s + d.payout, 0);
  const week = deliveries.reduce((s, d) => s + d.payout, 0);
  const month = week * 4.2;

  return (
    <div className="max-w-3xl">
      <h1 className="page-header mb-6">My Earnings</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today" value={formatKES(today)} icon={<DollarSign className="w-4 h-4" />} color="orange" />
        <StatCard label="This Week" value={formatKES(week)} icon={<TrendingUp className="w-4 h-4" />} color="teal" />
        <StatCard label="This Month" value={formatKES(Math.round(month))} icon={<DollarSign className="w-4 h-4" />} color="navy" />
        <StatCard label="Deliveries" value={`${deliveries.length}`} icon={<Package className="w-4 h-4" />} color="green" />
      </div>

      {/* Rating */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
          <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
        </div>
        <div>
          <p className="font-outfit font-bold text-navy text-2xl">4.8 / 5.0</p>
          <p className="font-josefin text-gray-500 text-sm">Based on {deliveries.length} deliveries</p>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Delivery History</h3>
        <div className="space-y-3">
          {deliveries.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-josefin text-gray-400 text-xs">{formatDate(d.date)}</p>
                <p className="font-josefin font-semibold text-navy text-sm">{d.from}</p>
                <p className="font-josefin text-gray-400 text-xs">→ {d.to}</p>
              </div>
              <p className="font-outfit font-bold text-green-600">{formatKES(d.payout)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
