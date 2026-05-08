"use client";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { formatKES, formatDate, STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

const ORDERS = [
  { id: "OT-K3X2P-AB12", customer: "Fatuma Hassan", supplier: "Mama Mboga", rider: "Hassan Mwangi", status: "delivered" as OrderStatus, amount: 2780, category: "Seafood", date: new Date(Date.now() - 2 * 3600000) },
  { id: "OT-M1Y9Q-CD34", customer: "Ahmed Bakari", supplier: "Lamu Fresh", rider: "David Omondi", status: "rider_assigned" as OrderStatus, amount: 1200, category: "Groceries", date: new Date(Date.now() - 30 * 60000) },
  { id: "OT-P5Z7R-EF56", customer: "Mama Rehema", supplier: "Island Supplies", rider: null, status: "pending" as OrderStatus, amount: 650, category: "Household", date: new Date(Date.now() - 5 * 60000) },
  { id: "OT-Q8W1N-GH78", customer: "John Mwenda", supplier: "Fatuma Fresh Fish", rider: "Ali Sefu", status: "delivered" as OrderStatus, amount: 1580, category: "Seafood", date: new Date(Date.now() - 24 * 3600000) },
  { id: "OT-R2X3M-IJ90", customer: "Sarah Wanjiku", supplier: "Mama Mboga", rider: null, status: "cancelled" as OrderStatus, amount: 450, category: "Fruits & Veg", date: new Date(Date.now() - 48 * 3600000) },
];

const statusBadge: Record<OrderStatus, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  pending: "yellow",
  confirmed: "blue",
  rider_assigned: "teal",
  picked_up: "orange",
  delivered: "green",
  cancelled: "red",
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = ORDERS.filter((o) => {
    const matchSearch = o.id.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">All Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{ORDERS.length} orders total</p>
        </div>
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
            <option value="rider_assigned">Rider Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
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
                  <td className="p-4 font-josefin text-teal font-semibold text-xs">{order.id}</td>
                  <td className="p-4 font-josefin font-semibold text-navy text-sm">{order.customer}</td>
                  <td className="p-4 font-josefin text-gray-500 text-sm">{order.supplier}</td>
                  <td className="p-4 font-josefin text-gray-500 text-sm">{order.rider ?? <span className="text-gray-300">—</span>}</td>
                  <td className="p-4 font-josefin text-gray-500 text-sm">{order.category}</td>
                  <td className="p-4">
                    <Badge variant={statusBadge[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                  </td>
                  <td className="p-4 font-outfit font-bold text-navy text-sm">{formatKES(order.amount)}</td>
                  <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(order.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
