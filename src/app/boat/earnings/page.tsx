"use client";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getBookingsByBoatOperator, tsToDate } from "@/lib/firebase/db";
import type { Booking } from "@/lib/firebase/db";

export default function BoatEarningsPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    if (!user?.uid) return;
    getBookingsByBoatOperator(user.uid)
      .then((all) => setHistory(all.filter((b) => b.status === "completed")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

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
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : history.length === 0 ? (
          <p className="text-center font-josefin text-gray-400 py-6">No completed bookings yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-josefin text-gray-400 text-xs">{formatDate(tsToDate(h.createdAt))}</p>
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
        )}
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
