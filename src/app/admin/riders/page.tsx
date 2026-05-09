"use client";
import { useEffect, useState } from "react";
import { Search, MapPin, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { getUsersByRole, tsToDate } from "@/lib/firebase/db";
import type { UserProfile } from "@/lib/firebase/auth";

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try { setRiders(await getUsersByRole("rider")); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = riders.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search)
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Rider Management</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{riders.length} total riders</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input className="input-field pl-10" placeholder="Search riders..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="card animate-pulse h-28 bg-gray-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🛵</p>
          <p className="font-outfit font-bold text-navy">No riders registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((rider) => (
            <div key={rider.uid} className="card">
              <div className="flex items-start gap-4 mb-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center">
                    <span className="font-outfit font-black text-white text-lg">{rider.name.charAt(0)}</span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    rider.status === "active" ? "bg-green-400" : rider.status === "suspended" ? "bg-red-400" : "bg-gray-300"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-outfit font-bold text-navy">{rider.name}</p>
                  <p className="font-josefin text-gray-400 text-sm">{rider.phone}</p>
                  {rider.vehicleType && <p className="font-josefin text-gray-400 text-xs">{rider.vehicleType}</p>}
                </div>
                <Badge variant={rider.status === "active" ? "green" : rider.status === "suspended" ? "red" : "yellow"}>
                  {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                <span className="font-josefin text-gray-400 text-xs">
                  Joined {rider.createdAt ? formatDate(tsToDate(rider.createdAt)) : "—"}
                </span>
                <button className="flex items-center gap-1 text-teal font-josefin text-xs hover:text-navy transition-colors">
                  <MapPin className="w-3.5 h-3.5" /> View on Map
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
