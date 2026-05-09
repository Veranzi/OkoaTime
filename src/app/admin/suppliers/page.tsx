"use client";
import { useState } from "react";
import { Check, X, Eye } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  businessName: string;
  email: string;
  category: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  joinedAt: Date;
  commission: number;
}

const SUPPLIERS: Supplier[] = [
  { id: "1", name: "Fatuma Hassan", businessName: "Fatuma Fresh Fish", email: "fatuma@example.com", category: "Seafood", location: "Lamu Town", status: "approved", joinedAt: new Date(Date.now() - 90 * 86400000), commission: 10 },
  { id: "2", name: "Mama Rehema", businessName: "Mama Mboga Lamu", email: "rehema@example.com", category: "Fruits & Veg", location: "Lamu Market", status: "pending", joinedAt: new Date(Date.now() - 2 * 86400000), commission: 10 },
  { id: "3", name: "Island Supplies", businessName: "Island Supermart", email: "island@example.com", category: "Household", location: "Shela", status: "approved", joinedAt: new Date(Date.now() - 60 * 86400000), commission: 12 },
  { id: "4", name: "Shela Groceries", businessName: "Shela Fresh Market", email: "shela@example.com", category: "Groceries", location: "Shela Village", status: "pending", joinedAt: new Date(Date.now() - 86400000), commission: 10 },
];

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);

  function updateStatus(id: string, status: "approved" | "rejected") {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success(status === "approved" ? "Supplier approved!" : "Supplier rejected");
  }

  function updateCommission(id: string, rate: number) {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, commission: rate } : s)));
    toast.success("Commission rate updated");
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Supplier Management</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {suppliers.filter((s) => s.status === "pending").length} pending approval
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className={`card ${supplier.status === "pending" ? "border-l-4 border-l-orange" : ""}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                <div className="min-w-0">
                  <p className="font-outfit font-bold text-navy truncate">{supplier.businessName}</p>
                  <p className="font-josefin text-gray-500 text-sm truncate">{supplier.name} · {supplier.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-josefin text-gray-400">{supplier.category}</span>
                    <span className="text-gray-200">|</span>
                    <span className="text-xs font-josefin text-gray-400">📍 {supplier.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={supplier.status === "approved" ? "green" : supplier.status === "pending" ? "yellow" : "red"}>
                  {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                </Badge>
                <p className="font-josefin text-gray-400 text-xs">{formatDate(supplier.joinedAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label className="font-josefin text-gray-500 text-sm">Commission Rate:</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm font-outfit font-bold text-navy text-center focus:outline-none focus:ring-1 focus:ring-teal"
                  value={supplier.commission}
                  min={0}
                  max={30}
                  onChange={(e) => updateCommission(supplier.id, Number(e.target.value))}
                />
                <span className="font-josefin text-gray-400 text-sm">%</span>
              </div>

              <div className="flex gap-2">
                {supplier.status === "pending" && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => updateStatus(supplier.id, "approved")}>
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => updateStatus(supplier.id, "rejected")}>
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </>
                )}
                {supplier.status === "approved" && (
                  <Button variant="outline" size="sm">
                    <Eye className="w-3.5 h-3.5" /> View Listings
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
