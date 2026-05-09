"use client";
import { useEffect, useState } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { getAllOrders, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", ready: "Ready",
  rider_assigned: "Rider Assigned", picked_up: "Picked Up",
  delivered: "Delivered", cancelled: "Cancelled",
};

const statusBadge: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  pending: "yellow", confirmed: "blue", ready: "teal",
  rider_assigned: "teal", picked_up: "orange",
  delivered: "green", cancelled: "red",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    setLoading(true);
    try { setOrders(await getAllOrders()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">All Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input-field pl-10" placeholder="Search by ID or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ready">Ready</option>
            <option value="rider_assigned">Rider Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order ID", "Customer", "Supplier", "Rider", "Category", "Status", "Amount", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-josefin text-teal font-semibold text-xs">{order.id.slice(0, 14)}</td>
                    <td className="p-4 font-josefin font-semibold text-navy text-sm">{order.customerName}</td>
                    <td className="p-4 font-josefin text-gray-500 text-sm">{order.supplierName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="p-4 font-josefin text-gray-500 text-sm">{order.riderName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="p-4 font-josefin text-gray-500 text-sm capitalize">{order.category}</td>
                    <td className="p-4"><Badge variant={statusBadge[order.status] ?? "gray"}>{STATUS_LABELS[order.status] ?? order.status}</Badge></td>
                    <td className="p-4 font-outfit font-bold text-navy text-sm">{formatKES(order.total)}</td>
                    <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(order.createdAt))}</td>
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
