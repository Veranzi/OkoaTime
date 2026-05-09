"use client";
import { useEffect, useState } from "react";
import { Check, X, Eye, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { getUsersByRole, updateUserDoc, tsToDate } from "@/lib/firebase/db";
import type { UserProfile } from "@/lib/firebase/auth";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setSuppliers(await getUsersByRole("supplier")); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(uid: string, status: "active" | "suspended" | "pending") {
    try {
      await updateUserDoc(uid, { status });
      setSuppliers((prev) => prev.map((s) => s.uid === uid ? { ...s, status } : s));
      toast.success(status === "active" ? "Supplier approved!" : "Supplier rejected");
    } catch { toast.error("Failed to update"); }
  }

  async function updateCommission(uid: string, rate: number) {
    try {
      await updateUserDoc(uid, { commission: rate });
      setSuppliers((prev) => prev.map((s) => s.uid === uid ? { ...s, commission: rate } as UserProfile : s));
      toast.success("Commission rate updated");
    } catch { toast.error("Failed to update"); }
  }

  const pending = suppliers.filter((s) => s.status === "pending");

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Supplier Management</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{pending.length} pending approval</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="card animate-pulse h-28 bg-gray-50" />)}</div>
      ) : suppliers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🏪</p>
          <p className="font-outfit font-bold text-navy">No suppliers registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) => {
            const commission = (supplier as UserProfile & { commission?: number }).commission ?? 10;
            return (
              <div key={supplier.uid} className={`card ${supplier.status === "pending" ? "border-l-4 border-l-orange" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                    <div className="min-w-0">
                      <p className="font-outfit font-bold text-navy truncate">{supplier.businessName ?? supplier.name}</p>
                      <p className="font-josefin text-gray-500 text-sm truncate">{supplier.name} · {supplier.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {supplier.serviceCategory && <span className="text-xs font-josefin text-gray-400 capitalize">{supplier.serviceCategory}</span>}
                        {supplier.location && <><span className="text-gray-200">|</span><span className="text-xs font-josefin text-gray-400">📍 {supplier.location}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={supplier.status === "active" ? "green" : supplier.status === "pending" ? "yellow" : "red"}>
                      {supplier.status === "active" ? "Approved" : supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                    </Badge>
                    <p className="font-josefin text-gray-400 text-xs">
                      {supplier.createdAt ? formatDate(tsToDate(supplier.createdAt)) : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <label className="font-josefin text-gray-500 text-sm">Commission Rate:</label>
                    <input
                      type="number"
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm font-outfit font-bold text-navy text-center focus:outline-none focus:ring-1 focus:ring-teal"
                      defaultValue={commission}
                      min={0}
                      max={30}
                      onBlur={(e) => updateCommission(supplier.uid, Number(e.target.value))}
                    />
                    <span className="font-josefin text-gray-400 text-sm">%</span>
                  </div>
                  <div className="flex gap-2">
                    {supplier.status === "pending" && (
                      <>
                        <Button variant="primary" size="sm" onClick={() => updateStatus(supplier.uid, "active")}>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => updateStatus(supplier.uid, "suspended")}>
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {supplier.status === "active" && (
                      <Button variant="outline" size="sm">
                        <Eye className="w-3.5 h-3.5" /> View Listings
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
