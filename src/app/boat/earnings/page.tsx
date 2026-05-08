"use client";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useState } from "react";
import toast from "react-hot-toast";

const history = [
  { id: "BK-001", route: "Lamu → Shela", passengers: 3, amount: 1500, commission: 150, net: 1350, date: new Date(Date.now() - 3 * 3600000) },
  { id: "BK-003", route: "Lamu → Manda", passengers: 8, amount: 4000, commission: 400, net: 3600, date: new Date(Date.now() - 86400000) },
  { id: "BK-005", route: "Shela → Manda", passengers: 4, amount: 2000, commission: 200, net: 1800, date: new Date(Date.now() - 3 * 86400000) },
];

export default function BoatEarningsPage() {
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [phone, setPhone] = useState("");

  const weekNet = history.reduce((s, h) => s + h.net, 0);
  const monthNet = weekNet * 4;
  const passengers = history.reduce((s, h) => s + h.passengers, 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Earnings</h1>
        <Button variant="primary" size="sm" onClick={() => setPayoutOpen(true)}>Request Payout</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="This Week (Net)" value={formatKES(weekNet)} icon={<TrendingUp className="w-5 h-5" />} color="teal" />
        <StatCard label="This Month (Net)" value={formatKES(monthNet)} icon={<DollarSign className="w-5 h-5" />} color="orange" />
        <StatCard label="Total Passengers" value={passengers.toString()} icon={<Users className="w-5 h-5" />} color="navy" />
      </div>

      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Booking History</h3>
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-josefin text-gray-400 text-xs">{formatDate(h.date)}</p>
                <p className="font-outfit font-bold text-navy text-sm">{h.route}</p>
                <p className="font-josefin text-gray-400 text-xs">{h.passengers} passengers</p>
              </div>
              <div className="text-right">
                <p className="font-josefin text-gray-400 text-xs">-{formatKES(h.commission)} commission</p>
                <p className="font-outfit font-bold text-green-600">{formatKES(h.net)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setPayoutOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-outfit font-bold text-xl text-navy mb-4">Request Payout</h3>
            <p className="font-josefin text-gray-500 text-sm mb-4">Available: <strong className="text-green-600">{formatKES(weekNet)}</strong></p>
            <input className="input-field mb-4" type="tel" placeholder="M-Pesa phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPayoutOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => { toast.success("Payout requested!"); setPayoutOpen(false); }}>
                Request {formatKES(weekNet)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
