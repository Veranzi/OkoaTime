"use client";
import { useEffect, useState } from "react";
import { Download, DollarSign, TrendingUp, CreditCard, RefreshCw, Banknote, Smartphone } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { getAllOrders, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const ITEM_COMM = 0.1;
const DELIVERY_COMM = 0.3;

// A "payment" is any order that has been delivered or has paymentStatus=paid
function isPaid(o: Order) {
  return o.status === "delivered" || o.paymentStatus === "paid";
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setOrders(await getAllOrders()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const paid = orders.filter(isPaid);
  const mpesa = paid.filter((o) => o.paymentMethod === "mpesa");
  const cash  = paid.filter((o) => o.paymentMethod === "cash");

  const totalRevenue    = paid.reduce((s, o) => s + o.total, 0);
  const totalItemComm   = paid.reduce((s, o) => s + Math.round(o.subtotal * ITEM_COMM), 0);
  const totalDelComm    = paid.reduce((s, o) => s + Math.round((o.deliveryFee ?? 0) * DELIVERY_COMM), 0);
  const totalOkoa       = totalItemComm + totalDelComm;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Payments & Commissions</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{paid.length} completed payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-teal" />
            <p className="font-josefin text-xs text-gray-400">Total Collected</p>
          </div>
          <p className="font-outfit font-black text-2xl text-navy">{formatKES(totalRevenue)}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">{paid.length} orders</p>
        </div>
        <div className="card p-4 bg-navy">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange" />
            <p className="font-josefin text-xs text-gray-300">OkoaTime Revenue</p>
          </div>
          <p className="font-outfit font-black text-2xl text-orange">{formatKES(totalOkoa)}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">Items {formatKES(totalItemComm)} + Delivery {formatKES(totalDelComm)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-green-500" />
            <p className="font-josefin text-xs text-gray-400">M-Pesa</p>
          </div>
          <p className="font-outfit font-black text-2xl text-navy">{formatKES(mpesa.reduce((s, o) => s + o.total, 0))}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">{mpesa.length} orders</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-blue-500" />
            <p className="font-josefin text-xs text-gray-400">Cash on Delivery</p>
          </div>
          <p className="font-outfit font-black text-2xl text-navy">{formatKES(cash.reduce((s, o) => s + o.total, 0))}</p>
          <p className="font-josefin text-gray-400 text-xs mt-1">{cash.length} orders</p>
        </div>
      </div>

      {/* Transaction log */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-outfit font-bold text-navy">Transaction Log</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" /></div>
        ) : paid.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No payments yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order ID", "Customer", "Supplier", "Method", "Subtotal", "Item Comm (10%)", "Delivery Fee", "Del. Comm (30%)", "OkoaTime", "Total", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paid.map((o) => {
                  const itemComm   = Math.round(o.subtotal * ITEM_COMM);
                  const delComm    = Math.round((o.deliveryFee ?? 0) * DELIVERY_COMM);
                  const okoaTotal  = itemComm + delComm;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 font-josefin text-teal text-xs font-semibold">{o.id.slice(0, 12)}</td>
                      <td className="p-4 font-josefin font-semibold text-navy text-sm whitespace-nowrap">{o.customerName}</td>
                      <td className="p-4 font-josefin text-gray-500 text-xs whitespace-nowrap">{o.supplierName ?? "—"}</td>
                      <td className="p-4">
                        <Badge variant={o.paymentMethod === "mpesa" ? "green" : "blue"}>
                          {o.paymentMethod === "mpesa" ? "M-Pesa" : "Cash"}
                        </Badge>
                      </td>
                      <td className="p-4 font-outfit font-semibold text-navy">{formatKES(o.subtotal)}</td>
                      <td className="p-4 font-outfit font-semibold text-orange">+{formatKES(itemComm)}</td>
                      <td className="p-4 font-outfit font-semibold text-gray-500">{formatKES(o.deliveryFee ?? 0)}</td>
                      <td className="p-4 font-outfit font-semibold text-orange">+{formatKES(delComm)}</td>
                      <td className="p-4 font-outfit font-bold text-green-600">{formatKES(okoaTotal)}</td>
                      <td className="p-4 font-outfit font-bold text-navy">{formatKES(o.total)}</td>
                      <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(o.createdAt))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-navy border-t-2 border-navy-700">
                  <td colSpan={4} className="p-4 font-outfit font-bold text-white text-sm">TOTALS — {paid.length} payments</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(paid.reduce((s, o) => s + o.subtotal, 0))}</td>
                  <td className="p-4 font-outfit font-bold text-orange text-sm">+{formatKES(totalItemComm)}</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(paid.reduce((s, o) => s + (o.deliveryFee ?? 0), 0))}</td>
                  <td className="p-4 font-outfit font-bold text-orange text-sm">+{formatKES(totalDelComm)}</td>
                  <td className="p-4 font-outfit font-bold text-green-400 text-sm">{formatKES(totalOkoa)}</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(totalRevenue)}</td>
                  <td className="p-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
