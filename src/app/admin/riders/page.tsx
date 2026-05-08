"use client";
import { useState } from "react";
import { Search, MapPin, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: "online" | "offline" | "suspended";
  deliveriesCompleted: number;
  rating: number;
  joinedAt: Date;
}

const RIDERS: Rider[] = [
  { id: "1", name: "Hassan Mwangi", phone: "+254712345678", vehicle: "Bicycle", status: "online", deliveriesCompleted: 124, rating: 4.8, joinedAt: new Date(Date.now() - 90 * 86400000) },
  { id: "2", name: "David Omondi", phone: "+254723456789", vehicle: "Motorbike", status: "online", deliveriesCompleted: 89, rating: 4.6, joinedAt: new Date(Date.now() - 60 * 86400000) },
  { id: "3", name: "Ali Sefu", phone: "+254734567890", vehicle: "Bicycle", status: "offline", deliveriesCompleted: 67, rating: 4.9, joinedAt: new Date(Date.now() - 45 * 86400000) },
  { id: "4", name: "Omar Said", phone: "+254745678901", vehicle: "On Foot", status: "offline", deliveriesCompleted: 34, rating: 4.7, joinedAt: new Date(Date.now() - 30 * 86400000) },
  { id: "5", name: "John Kamau", phone: "+254756789012", vehicle: "Bicycle", status: "suspended", deliveriesCompleted: 12, rating: 3.2, joinedAt: new Date(Date.now() - 20 * 86400000) },
];

export default function AdminRidersPage() {
  const [search, setSearch] = useState("");
  const riders = RIDERS.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search)
  );

  const online = riders.filter((r) => r.status === "online").length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Rider Management</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            <span className="text-green-600 font-semibold">{online} online</span> · {riders.length} total riders
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input className="input-field pl-10" placeholder="Search riders..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {riders.map((rider) => (
          <div key={rider.id} className="card">
            <div className="flex items-start gap-4 mb-3">
              <div className="relative">
                <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center">
                  <span className="font-outfit font-black text-white text-lg">{rider.name.charAt(0)}</span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  rider.status === "online" ? "bg-green-400" : rider.status === "offline" ? "bg-gray-300" : "bg-red-400"
                }`} />
              </div>
              <div className="flex-1">
                <p className="font-outfit font-bold text-navy">{rider.name}</p>
                <p className="font-josefin text-gray-400 text-sm">{rider.phone} · {rider.vehicle}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="font-josefin text-gray-500 text-xs">{rider.rating} · {rider.deliveriesCompleted} deliveries</span>
                </div>
              </div>
              <Badge variant={rider.status === "online" ? "green" : rider.status === "offline" ? "gray" : "red"}>
                {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
              <span className="font-josefin text-gray-400 text-xs">Joined {formatDate(rider.joinedAt)}</span>
              {rider.status === "online" && (
                <button className="flex items-center gap-1 text-teal font-josefin text-xs hover:text-navy transition-colors">
                  <MapPin className="w-3.5 h-3.5" /> View on Map
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
