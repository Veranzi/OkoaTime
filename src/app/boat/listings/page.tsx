"use client";
import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { formatKES } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface BoatListing {
  id: string;
  name: string;
  capacity: number;
  pricePerTrip: number;
  routes: string[];
  available: boolean;
  description: string;
}

const INITIAL_BOATS: BoatListing[] = [
  { id: "1", name: "Al-Noor", capacity: 8, pricePerTrip: 500, routes: ["Lamu → Shela", "Shela → Manda"], available: true, description: "Traditional wooden dhow, comfortable and reliable" },
  { id: "2", name: "Bahari Express", capacity: 12, pricePerTrip: 800, routes: ["Lamu → Manda", "Custom routes"], available: false, description: "Motorized boat, fastest on the water" },
];

export default function BoatListingsPage() {
  const [boats, setBoats] = useState<BoatListing[]>(INITIAL_BOATS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBoat, setEditBoat] = useState<Partial<BoatListing>>({});

  function toggleAvailable(id: string) {
    setBoats((prev) => prev.map((b) => (b.id === id ? { ...b, available: !b.available } : b)));
  }

  function saveBoat() {
    if (!editBoat.name || !editBoat.pricePerTrip) return;
    if (editBoat.id) {
      setBoats((prev) => prev.map((b) => (b.id === editBoat.id ? { ...b, ...editBoat } as BoatListing : b)));
    } else {
      setBoats((prev) => [...prev, { ...editBoat, id: Date.now().toString(), routes: [], available: true } as BoatListing]);
    }
    setModalOpen(false);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">My Boats</h1>
        <Button variant="primary" size="sm" onClick={() => { setEditBoat({ available: true }); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Boat
        </Button>
      </div>

      <div className="space-y-4">
        {boats.map((boat) => (
          <div key={boat.id} className={`card ${!boat.available ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-2xl">⛵</div>
                <div>
                  <p className="font-outfit font-bold text-navy text-lg">{boat.name}</p>
                  <p className="font-josefin text-gray-400 text-sm">Capacity: {boat.capacity} passengers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAvailable(boat.id)}
                  className={`p-1.5 rounded-lg transition-colors ${boat.available ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {boat.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditBoat(boat); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setBoats((prev) => prev.filter((b) => b.id !== boat.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="font-josefin text-gray-500 text-sm mb-3">{boat.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {boat.routes.map((route) => (
                <span key={route} className="bg-teal-50 text-teal text-xs font-josefin font-semibold px-3 py-1 rounded-full">
                  {route}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="font-outfit font-bold text-orange text-xl">{formatKES(boat.pricePerTrip)} <span className="text-gray-400 text-sm font-josefin font-normal">/ trip</span></p>
              <span className={`text-xs font-josefin font-semibold px-2 py-0.5 rounded-full ${boat.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {boat.available ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editBoat.id ? "Edit Boat" : "Add Boat"}>
        <div className="space-y-4">
          <Input label="Boat Name" placeholder="Al-Noor" value={editBoat.name ?? ""} onChange={(e) => setEditBoat((b) => ({ ...b, name: e.target.value }))} />
          <Input label="Capacity (passengers)" type="number" value={editBoat.capacity ?? ""} onChange={(e) => setEditBoat((b) => ({ ...b, capacity: Number(e.target.value) }))} />
          <Input label="Price Per Trip (KES)" type="number" value={editBoat.pricePerTrip ?? ""} onChange={(e) => setEditBoat((b) => ({ ...b, pricePerTrip: Number(e.target.value) }))} />
          <div>
            <label className="label">Description</label>
            <textarea className="input-field resize-none h-20" value={editBoat.description ?? ""} onChange={(e) => setEditBoat((b) => ({ ...b, description: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={saveBoat}>{editBoat.id ? "Save" : "Add Boat"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
