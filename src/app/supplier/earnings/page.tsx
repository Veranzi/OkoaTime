"use client";
import { useState } from "react";
import { DollarSign, TrendingUp, Download, Phone } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

const transactions = [
  { id: "OT-K3X2P-AB12", customer: "Fatuma Hassan", amount: 1580, commission: 158, net: 1422, date: new Date(Date.now() - 86400000), status: "paid" },
  { id: "OT-M1Y9Q-CD34", customer: "Ahmed Bakari", amount: 1200, commission: 120, net: 1080, date: new Date(Date.now() - 2 * 86400000), status: "paid" },
  { id: "OT-P5Z7R-EF56", customer: "David Omondi", amount: 1140, commission: 114, net: 1026, date: new Date(Date.now() - 3 * 86400000), status: "pending" },
  { id: "OT-Q8W1N-GH78", customer: "Mama Aisha", amount: 900, commission: 90, net: 810, date: new Date(Date.now() - 5 * 86400000), status: "paid" },
  { id: "OT-R2X3M-IJ90", customer: "John Mwenda", amount: 2040, commission: 204, net: 1836, date: new Date(Date.now() - 7 * 86400000), status: "paid" },
];

export default function SupplierEarningsPage() {
  const [payoutPhone, setPayoutPhone] = useState("");
  const [payoutOpen, setPayoutOpen] = useState(false);

  const thisWeek = transactions.reduce((sum, t) => sum + t.net, 0);
  const thisMonth = thisWeek * 3.5;
  const pending = transactions.filter((t) => t.status === "pending").reduce((sum, t) => sum + t.net, 0);

  async function requestPayout() {
    if (!payoutPhone) return toast.error("Enter your M-Pesa number");
    toast.success("Payout request submitted! Expect payment within 24 hours.");
    setPayoutOpen(false);
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Earnings & Payouts</h1>
        <Button variant="primary" size="sm" onClick={() => setPayoutOpen(true)}>
          <Phone className="w-4 h-4" /> Request Payout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="This Week (Net)"
          value={formatKES(thisWeek)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="teal"
          trend="+12% from last week"
        />
        <StatCard
          label="This Month (Net)"
          value={formatKES(Math.round(thisMonth))}
          icon={<DollarSign className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          label="Pending Payout"
          value={formatKES(pending)}
          icon={<DollarSign className="w-5 h-5" />}
          color="navy"
        />
      </div>

      {/* Commission Note */}
      <div className="bg-navy-50 rounded-2xl p-4 mb-6 text-sm font-josefin text-gray-600">
        💡 OkoaTime charges a <strong className="text-navy">10% platform commission</strong> on each order.
        Net earnings = Order Amount - Commission.
      </div>

      {/* Transaction Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-outfit font-bold text-navy">Transaction History</h3>
          <button className="flex items-center gap-1.5 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Order ID</th>
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Customer</th>
                <th className="text-right font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Amount</th>
                <th className="text-right font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Commission</th>
                <th className="text-right font-outfit font-semibold text-gray-400 text-xs pb-3 pr-4">Net</th>
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3">Date</th>
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-josefin text-gray-500 text-xs">{t.id}</td>
                  <td className="py-3 pr-4 font-josefin font-semibold text-navy">{t.customer}</td>
                  <td className="py-3 pr-4 text-right font-outfit font-semibold text-navy">{formatKES(t.amount)}</td>
                  <td className="py-3 pr-4 text-right font-josefin text-red-400">-{formatKES(t.commission)}</td>
                  <td className="py-3 pr-4 text-right font-outfit font-bold text-green-600">{formatKES(t.net)}</td>
                  <td className="py-3 pr-4 font-josefin text-gray-400 text-xs">{formatDate(t.date)}</td>
                  <td className="py-3">
                    <span className={`text-xs font-josefin font-semibold px-2 py-0.5 rounded-full ${
                      t.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setPayoutOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-outfit font-bold text-xl text-navy mb-2">Request Payout</h3>
            <p className="font-josefin text-gray-500 text-sm mb-4">
              Available balance: <strong className="text-green-600">{formatKES(thisWeek)}</strong>
            </p>
            <div className="mb-4">
              <label className="label">M-Pesa Phone Number</label>
              <input
                className="input-field"
                type="tel"
                placeholder="0712 345 678"
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPayoutOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={requestPayout}>
                Request {formatKES(thisWeek)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
