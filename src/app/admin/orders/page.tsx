"use client";
import { useEffect, useState } from "react";
import { Search, Filter, RefreshCw, TrendingUp, DollarSign, Truck, Package, Ship } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { getAllOrders, tsToDate } from "@/lib/firebase/db";
import type { Order } from "@/lib/firebase/db";

const ITEM_COMM = 0.1;       // OkoaTime takes 10% of subtotal from supplier
const DELIVERY_COMM = 0.3;   // OkoaTime keeps 30% of delivery fee
const RIDER_SHARE = 0.7;     // Rider gets 70% of delivery fee

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

function calc(o: Order) {
  const itemComm   = Math.round(o.subtotal * ITEM_COMM);
  const supplierNet = o.subtotal - itemComm;
  const deliveryFee = o.deliveryFee ?? 0;
  const deliveryComm = Math.round(deliveryFee * DELIVERY_COMM);
  const riderPayout  = o.riderPayout ?? Math.round(deliveryFee * RIDER_SHARE);
  const okoaRevenue  = itemComm + deliveryComm;
  return { itemComm, supplierNet, deliveryFee, deliveryComm, riderPayout, okoaRevenue };
}

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

  // Summary totals across filtered set
  const totals = filtered.reduce((acc, o) => {
    const c = calc(o);
    return {
      grandTotal:     acc.grandTotal     + o.total,
      subtotal:       acc.subtotal       + o.subtotal,
      itemComm:       acc.itemComm       + c.itemComm,
      supplierNet:    acc.supplierNet    + c.supplierNet,
      deliveryFee:    acc.deliveryFee    + c.deliveryFee,
      deliveryComm:   acc.deliveryComm   + c.deliveryComm,
      riderPayout:    acc.riderPayout    + c.riderPayout,
      okoaRevenue:    acc.okoaRevenue    + c.okoaRevenue,
    };
  }, { grandTotal: 0, subtotal: 0, itemComm: 0, supplierNet: 0, deliveryFee: 0, deliveryComm: 0, riderPayout: 0, okoaRevenue: 0 });

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">All Orders</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="card bg-navy text-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange" />
              <p className="font-josefin text-xs text-gray-300">OkoaTime Revenue</p>
            </div>
            <p className="font-outfit font-black text-xl text-orange">{formatKES(totals.okoaRevenue)}</p>
            <p className="font-josefin text-gray-400 text-xs mt-1">Item {formatKES(totals.itemComm)} + Delivery {formatKES(totals.deliveryComm)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-teal" />
              <p className="font-josefin text-xs text-gray-400">Suppliers Get</p>
            </div>
            <p className="font-outfit font-black text-xl text-navy">{formatKES(totals.supplierNet)}</p>
            <p className="font-josefin text-gray-400 text-xs mt-1">90% of {formatKES(totals.subtotal)} subtotal</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-orange" />
              <p className="font-josefin text-xs text-gray-400">Riders Get</p>
            </div>
            <p className="font-outfit font-black text-xl text-navy">{formatKES(totals.riderPayout)}</p>
            <p className="font-josefin text-gray-400 text-xs mt-1">70% of {formatKES(totals.deliveryFee)} delivery</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Ship className="w-4 h-4 text-blue-500" />
              <p className="font-josefin text-xs text-gray-400">Boat Operators</p>
            </div>
            <p className="font-outfit font-black text-xl text-navy">—</p>
            <p className="font-josefin text-gray-400 text-xs mt-1">See Bookings section</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <p className="font-josefin text-xs text-gray-400">Total Transacted</p>
            </div>
            <p className="font-outfit font-black text-xl text-navy">{formatKES(totals.grandTotal)}</p>
            <p className="font-josefin text-gray-400 text-xs mt-1">{filtered.length} orders</p>
          </div>
        </div>
      )}

      {/* Filters */}
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

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Order ID</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Customer</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Supplier</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Rider</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Status</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Subtotal</th>
                  <th className="text-left font-outfit font-semibold text-teal text-xs p-3 whitespace-nowrap">Supplier Net (90%)</th>
                  <th className="text-left font-outfit font-semibold text-orange text-xs p-3 whitespace-nowrap">Item Comm (10%)</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Delivery Fee</th>
                  <th className="text-left font-outfit font-semibold text-blue-500 text-xs p-3 whitespace-nowrap">Rider (70%)</th>
                  <th className="text-left font-outfit font-semibold text-orange text-xs p-3 whitespace-nowrap">Delivery Comm (30%)</th>
                  <th className="text-left font-outfit font-semibold text-green-600 text-xs p-3 whitespace-nowrap">OkoaTime Total</th>
                  <th className="text-left font-outfit font-semibold text-navy text-xs p-3 whitespace-nowrap">Order Total</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const c = calc(order);
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-josefin text-teal font-semibold text-xs">{order.id.slice(0, 12)}</td>
                      <td className="p-3 font-josefin font-semibold text-navy text-sm whitespace-nowrap">{order.customerName}</td>
                      <td className="p-3 font-josefin text-gray-500 text-xs whitespace-nowrap">{order.supplierName ?? <span className="text-gray-300">—</span>}</td>
                      <td className="p-3 font-josefin text-gray-500 text-xs whitespace-nowrap">{order.riderName ?? <span className="text-gray-300">—</span>}</td>
                      <td className="p-3"><Badge variant={statusBadge[order.status] ?? "gray"}>{STATUS_LABELS[order.status] ?? order.status}</Badge></td>
                      <td className="p-3 font-outfit font-semibold text-navy text-sm">{formatKES(order.subtotal)}</td>
                      <td className="p-3 font-outfit font-semibold text-teal text-sm">{formatKES(c.supplierNet)}</td>
                      <td className="p-3 font-outfit font-semibold text-orange text-sm">+{formatKES(c.itemComm)}</td>
                      <td className="p-3 font-outfit font-semibold text-gray-500 text-sm">{formatKES(c.deliveryFee)}</td>
                      <td className="p-3 font-outfit font-semibold text-blue-500 text-sm">{formatKES(c.riderPayout)}</td>
                      <td className="p-3 font-outfit font-semibold text-orange text-sm">+{formatKES(c.deliveryComm)}</td>
                      <td className="p-3 font-outfit font-bold text-green-600 text-sm">{formatKES(c.okoaRevenue)}</td>
                      <td className="p-3 font-outfit font-bold text-navy text-sm">{formatKES(order.total)}</td>
                      <td className="p-3 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(order.createdAt))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-navy border-t-2 border-navy-700">
                  <td colSpan={5} className="p-3 font-outfit font-bold text-white text-sm">TOTALS — {filtered.length} orders</td>
                  <td className="p-3 font-outfit font-bold text-white text-sm">{formatKES(totals.subtotal)}</td>
                  <td className="p-3 font-outfit font-bold text-teal text-sm">{formatKES(totals.supplierNet)}</td>
                  <td className="p-3 font-outfit font-bold text-orange text-sm">+{formatKES(totals.itemComm)}</td>
                  <td className="p-3 font-outfit font-bold text-white text-sm">{formatKES(totals.deliveryFee)}</td>
                  <td className="p-3 font-outfit font-bold text-blue-300 text-sm">{formatKES(totals.riderPayout)}</td>
                  <td className="p-3 font-outfit font-bold text-orange text-sm">+{formatKES(totals.deliveryComm)}</td>
                  <td className="p-3 font-outfit font-bold text-green-400 text-sm">{formatKES(totals.okoaRevenue)}</td>
                  <td className="p-3 font-outfit font-bold text-white text-sm">{formatKES(totals.grandTotal)}</td>
                  <td className="p-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
