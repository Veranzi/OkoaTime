"use client";
import { Download, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const transactions = [
  { id: "MP-2024001", orderId: "OT-K3X2P-AB12", customer: "Fatuma Hassan", amount: 2780, mpesaReceipt: "QH12345678", commission: 278, status: "completed", date: new Date(Date.now() - 2 * 3600000) },
  { id: "MP-2024002", orderId: "OT-M1Y9Q-CD34", customer: "Ahmed Bakari", amount: 1200, mpesaReceipt: "QH23456789", commission: 120, status: "completed", date: new Date(Date.now() - 5 * 3600000) },
  { id: "MP-2024003", orderId: "OT-P5Z7R-EF56", customer: "Mama Rehema", amount: 650, mpesaReceipt: "CASH", commission: 65, status: "cash", date: new Date(Date.now() - 24 * 3600000) },
  { id: "MP-2024004", orderId: "OT-Q8W1N-GH78", customer: "John Mwenda", amount: 1580, mpesaReceipt: "QH34567890", commission: 158, status: "completed", date: new Date(Date.now() - 48 * 3600000) },
  { id: "MP-2024005", orderId: "OT-R2X3M-IJ90", customer: "Sarah Wanjiku", amount: 450, mpesaReceipt: "REFUNDED", commission: 0, status: "refunded", date: new Date(Date.now() - 3 * 86400000) },
];

const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);

const statusBadge: Record<string, "green" | "red" | "yellow" | "orange" | "gray"> = {
  completed: "green",
  refunded: "red",
  pending: "yellow",
  cash: "orange",
};

export default function AdminPaymentsPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">Payments & Commissions</h1>
        <button className="flex items-center gap-2 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatKES(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} color="teal" />
        <StatCard label="Platform Commission" value={formatKES(totalCommission)} icon={<TrendingUp className="w-5 h-5" />} color="orange" />
        <StatCard label="Transactions" value={transactions.length.toString()} icon={<CreditCard className="w-5 h-5" />} color="navy" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-outfit font-bold text-navy">Transaction Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Transaction ID", "Order ID", "Customer", "Amount", "M-Pesa Receipt", "Commission", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-josefin text-gray-500 text-xs">{t.id}</td>
                  <td className="p-4 font-josefin text-teal text-xs font-semibold">{t.orderId}</td>
                  <td className="p-4 font-josefin font-semibold text-navy text-sm">{t.customer}</td>
                  <td className="p-4 font-outfit font-bold text-navy">{formatKES(t.amount)}</td>
                  <td className="p-4 font-josefin text-gray-500 text-xs">{t.mpesaReceipt}</td>
                  <td className="p-4 font-outfit font-semibold text-orange">{formatKES(t.commission)}</td>
                  <td className="p-4">
                    <Badge variant={statusBadge[t.status] ?? "gray"}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(t.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
