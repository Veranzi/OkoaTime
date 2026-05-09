"use client";
import { useEffect, useState } from "react";
import { Download, DollarSign, TrendingUp, CreditCard, RefreshCw } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getAllPayments, tsToDate } from "@/lib/firebase/db";
import type { Payment } from "@/lib/firebase/db";

const COMMISSION_RATE = 0.1;

const statusBadge: Record<string, "green" | "red" | "yellow" | "orange" | "gray"> = {
  completed: "green",
  failed: "red",
  pending: "yellow",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setPayments(await getAllPayments()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const totalCommission = Math.round(totalRevenue * COMMISSION_RATE);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Payments & Commissions</h1>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatKES(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} color="teal" />
        <StatCard label="Platform Commission" value={formatKES(totalCommission)} icon={<TrendingUp className="w-5 h-5" />} color="orange" />
        <StatCard label="Transactions" value={payments.length.toString()} icon={<CreditCard className="w-5 h-5" />} color="navy" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-outfit font-bold text-navy">Transaction Log</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" /></div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No payments yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order ID", "Phone", "Amount", "M-Pesa Receipt", "Commission", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-josefin text-teal text-xs font-semibold">{t.orderId?.slice(0, 14) ?? "—"}</td>
                    <td className="p-4 font-josefin text-gray-500 text-sm">{t.phone}</td>
                    <td className="p-4 font-outfit font-bold text-navy">{formatKES(t.amount)}</td>
                    <td className="p-4 font-josefin text-gray-500 text-xs">{t.mpesaReceiptNumber ?? "—"}</td>
                    <td className="p-4 font-outfit font-semibold text-orange">{formatKES(Math.round(t.amount * COMMISSION_RATE))}</td>
                    <td className="p-4">
                      <Badge variant={statusBadge[t.status] ?? "gray"}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(t.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
