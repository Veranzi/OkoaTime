"use client";
import Link from "next/link";
import { MapPin, RotateCcw, ChevronRight } from "lucide-react";
import { formatKES, formatDate, STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const mockOrders = [
  { id: "OT-K3X2P-AB12", category: "Seafood", items: "2x Grilled Tuna, 1x King Prawns", status: "delivered" as OrderStatus, total: 2780, date: new Date(Date.now() - 86400000) },
  { id: "OT-M1Y9Q-CD34", category: "Groceries", items: "Unga wa Ugali, Sugar, Rice", status: "delivered" as OrderStatus, total: 1200, date: new Date(Date.now() - 2 * 86400000) },
  { id: "OT-P5Z7R-EF56", category: "Fruits & Vegetables", items: "Tomatoes, Onions, Mangoes", status: "cancelled" as OrderStatus, total: 650, date: new Date(Date.now() - 3 * 86400000) },
  { id: "OT-Q8W1N-GH78", category: "Household", items: "Soap, Omo, Toilet Paper", status: "delivered" as OrderStatus, total: 360, date: new Date(Date.now() - 7 * 86400000) },
  { id: "OT-R2X3M-IJ90", category: "Seafood", items: "Lobster, Snapper Fish", status: "rider_assigned" as OrderStatus, total: 1580, date: new Date() },
];

const statusVariant: Record<string, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  delivered: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "blue",
  rider_assigned: "teal",
  picked_up: "orange",
};

export default function OrdersPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Order History</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{mockOrders.length} orders total</p>
        </div>
        <Link href="/dashboard/order/new">
          <Button variant="primary" size="sm">New Order</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {mockOrders.map((order) => (
          <div key={order.id} className="card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-josefin text-gray-400 text-xs">{formatDate(order.date)}</p>
                <p className="font-outfit font-bold text-navy text-sm mt-0.5">#{order.id}</p>
                <p className="font-josefin text-gray-500 text-xs mt-0.5">{order.category} · {order.items}</p>
              </div>
              <Badge variant={statusVariant[order.status] ?? "gray"}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="font-outfit font-bold text-navy">{formatKES(order.total)}</p>
              <div className="flex items-center gap-2">
                {order.status === "rider_assigned" || order.status === "picked_up" ? (
                  <Link href={`/dashboard/track/${order.id}`}>
                    <Button variant="teal" size="sm">
                      <MapPin className="w-3.5 h-3.5" /> Track
                    </Button>
                  </Link>
                ) : null}
                {order.status === "delivered" && (
                  <Link href="/dashboard/order/new">
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-3.5 h-3.5" /> Reorder
                    </Button>
                  </Link>
                )}
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
