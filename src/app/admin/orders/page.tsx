"use client";
import { useEffect, useState } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { getAllOrders, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const COMMISSION_RATE = 0.1;
const DELIVERY_COMMISSION_RATE = 0.3;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", ready: "Ready",
  rider_assigned: "Rider Assigned", picked_up: "Picked Up",
  at_jetty: "At Jetty", boat_assigned: "Boat Assigned", on_water: "On Water",
  delivered: "Delivered", cancelled: "Cancelled",
};

const statusBadge: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  pending: "yellow", confirmed: "blue", ready: "teal",
  rider_assigned: "teal", picked_up: "orange", at_jetty: "orange",
  boat_assigned: "teal", on_water: "blue",
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

  // Totals across filtered orders
  const totalSubtotal = filtered.reduce((s, o) => s + o.subtotal, 0);
  const totalItemCommission = filtered.reduce((s, o) => s + Math.round(o.subtotal * COMMISSION_RATE), 0);
  const totalDeliveryFee = filtered.reduce((s, o) => s + (o.deliveryFee ?? 0), 0);
  const totalDeliveryCommission = filtered.reduce((s, o) => s + Math.round((o.deliveryFee ?? 0) * DELIVERY_COMMISSION_RATE), 0);
  const totalRevenue = totalItemCommission + totalDeliveryCommission;
  const grandTotal = filtered.reduce((s, o) => s + o.total, 0);

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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
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
                  {["Order ID", "Customer", "Supplier", "Rider", "Status", "Subtotal", "Item Comm. (10%)", "Delivery Fee", "Delivery Comm. (30%)", "Total", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const itemComm = Math.round(order.subtotal * COMMISSION_RATE);
                  const deliveryComm = Math.round((order.deliveryFee ?? 0) * DELIVERY_COMMISSION_RATE);
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-josefin text-teal font-semibold text-xs">{order.id.slice(0, 14)}</td>
                      <td className="p-4 font-josefin font-semibold text-navy text-sm">{order.customerName}</td>
                      <td className="p-4 font-josefin text-gray-500 text-sm">{order.supplierName ?? <span className="text-gray-300">—</span>}</td>
                      <td className="p-4 font-josefin text-gray-500 text-sm">{order.riderName ?? <span className="text-gray-300">—</span>}</td>
                      <td className="p-4"><Badge variant={statusBadge[order.status] ?? "gray"}>{STATUS_LABELS[order.status] ?? order.status}</Badge></td>
                      <td className="p-4 font-outfit font-semibold text-navy text-sm">{formatKES(order.subtotal)}</td>
                      <td className="p-4 font-outfit font-semibold text-green-600 text-sm">+{formatKES(itemComm)}</td>
                      <td className="p-4 font-outfit font-semibold text-gray-500 text-sm">{formatKES(order.deliveryFee ?? 0)}</td>
                      <td className="p-4 font-outfit font-semibold text-green-600 text-sm">+{formatKES(deliveryComm)}</td>
                      <td className="p-4 font-outfit font-bold text-navy text-sm">{formatKES(order.total)}</td>
                      <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(order.createdAt))}</td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="bg-navy border-t-2 border-navy">
                  <td colSpan={5} className="p-4 font-outfit font-bold text-white text-sm">
                    Totals ({filtered.length} orders)
                  </td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(totalSubtotal)}</td>
                  <td className="p-4 font-outfit font-bold text-orange text-sm">+{formatKES(totalItemCommission)}</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(totalDeliveryFee)}</td>
                  <td className="p-4 font-outfit font-bold text-orange text-sm">+{formatKES(totalDeliveryCommission)}</td>
                  <td className="p-4 font-outfit font-bold text-white text-sm">{formatKES(grandTotal)}</td>
                  <td className="p-4">
                    <span className="font-josefin text-orange text-xs font-semibold">Revenue: {formatKES(totalRevenue)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
