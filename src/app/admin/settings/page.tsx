"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

const ZONES = [
  { id: "lamu", name: "Lamu Town", fee: 100 },
  { id: "shela", name: "Shela Village", fee: 150 },
  { id: "manda", name: "Manda Island", fee: 200 },
  { id: "lamu_shela", name: "Lamu ↔ Shela", fee: 180 },
  { id: "shela_manda", name: "Shela ↔ Manda", fee: 220 },
];

export default function AdminSettingsPage() {
  const [zones, setZones] = useState(ZONES);
  const [commissionRate, setCommissionRate] = useState(10);
  const [smsTemplate, setSmsTemplate] = useState("Your OkoaTime order #{{orderId}} has been {{status}}. Rider: {{riderName}} · ETA: {{eta}} mins.");
  const [pushTemplate, setPushTemplate] = useState("Your order is on its way! Track live at okoatime.co.ke/track/{{orderId}}");

  function saveSettings() {
    toast.success("Settings saved successfully!");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="page-header">Platform Settings</h1>

      {/* Delivery Fee Zones */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Delivery Fee by Zone (KES)</h3>
        <div className="space-y-3">
          {zones.map((zone, i) => (
            <div key={zone.id} className="flex items-center gap-4">
              <span className="font-josefin text-gray-600 text-sm flex-1">{zone.name}</span>
              <input
                type="number"
                className="input-field w-24 text-right"
                value={zone.fee}
                onChange={(e) => setZones(zones.map((z, j) => j === i ? { ...z, fee: Number(e.target.value) } : z))}
              />
              <span className="font-josefin text-gray-400 text-sm">KES</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Rate */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Platform Commission Rate</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            className="input-field w-24 text-right"
            value={commissionRate}
            min={0}
            max={50}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
          />
          <span className="font-josefin text-gray-500">% of each order amount</span>
        </div>
        <p className="font-josefin text-gray-400 text-xs mt-2">
          Current: {commissionRate}% — On a KES 1,000 order, platform earns KES {commissionRate * 10}.
        </p>
      </div>

      {/* Service Areas */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Service Areas</h3>
        <div className="flex flex-wrap gap-2">
          {["Lamu Town", "Lamu Waterfront", "Shela Village", "Shela Beach", "Manda Island", "Manda Airport"].map((area) => (
            <span key={area} className="bg-teal-50 text-teal text-sm font-josefin font-semibold px-3 py-1.5 rounded-xl border border-teal/20">
              📍 {area}
            </span>
          ))}
        </div>
        <button className="mt-3 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors">
          + Add Service Area
        </button>
      </div>

      {/* Notification Templates */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-4">Notification Templates</h3>

        <div className="space-y-4">
          <div>
            <label className="label">SMS Template</label>
            <textarea
              className="input-field resize-none h-20 font-mono text-xs"
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
            />
            <p className="font-josefin text-gray-400 text-xs mt-1">
              Variables: {"{{orderId}}"}, {"{{status}}"}, {"{{riderName}}"}, {"{{eta}}"}
            </p>
          </div>
          <div>
            <label className="label">Push Notification Template</label>
            <textarea
              className="input-field resize-none h-20 font-mono text-xs"
              value={pushTemplate}
              onChange={(e) => setPushTemplate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button variant="primary" size="md" className="w-full" onClick={saveSettings}>
        <Save className="w-4 h-4" /> Save All Settings
      </Button>
    </div>
  );
}
