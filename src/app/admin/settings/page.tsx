"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { getPricingSettings, savePricingSettings } from "@/lib/pricing-client";
import { DEFAULT_PRICING_SETTINGS, type DeliveryZone, type PricingSettings } from "@/lib/pricing";
import type { PlatformRates } from "@/lib/utils";
import type { DeliveryType } from "@/lib/firebase/db";

const RATE_FIELDS: { key: keyof PlatformRates; label: string; hint: string }[] = [
  { key: "commissionRate", label: "Supplier commission", hint: "% of each order's item subtotal. Default for suppliers without their own rate." },
  { key: "riderShare", label: "Rider share — bike delivery", hint: "% of the delivery fee when a rider does the whole delivery." },
  { key: "boatShare", label: "Boat share — boat delivery", hint: "% of the delivery fee when a boat operator does the whole delivery." },
  { key: "riderShareHandoff", label: "Rider share — bike + boat", hint: "% of the delivery fee for the rider's leg (pickup to jetty)." },
  { key: "boatShareHandoff", label: "Boat share — bike + boat", hint: "% of the delivery fee for the boat's leg (jetty to customer)." },
];

const DELIVERY_TYPES: { value: DeliveryType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "bike_to_boat", label: "Bike + Boat" },
  { value: "boat", label: "Boat" },
];

function validate(s: PricingSettings): string | null {
  for (const f of RATE_FIELDS) {
    const v = s[f.key];
    if (!Number.isFinite(v) || v < 0 || v > 100) return `${f.label} must be between 0 and 100.`;
  }
  if (s.riderShareHandoff + s.boatShareHandoff > 100) {
    return "Rider + boat shares on a bike + boat delivery can't add up to more than 100%.";
  }
  if (s.deliveryZones.length === 0) return "Add at least one delivery zone.";
  const ids = new Set<string>();
  for (const z of s.deliveryZones) {
    if (!z.label.trim()) return "Every delivery zone needs a name.";
    if (!Number.isInteger(z.fee) || z.fee < 0) return `Delivery fee for ${z.label} must be a whole number of KES.`;
    if (ids.has(z.id)) return `Two zones share the id "${z.id}".`;
    ids.add(z.id);
  }
  if (!s.deliveryZones.some((z) => z.active)) return "At least one delivery zone must be switched on.";
  return null;
}

function newZoneId(label: string, taken: string[]): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "zone";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}_${n}`;
  return id;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPricingSettings()
      .then(setSettings)
      .catch(() => toast.error("Failed to load pricing settings"))
      .finally(() => setLoaded(true));
  }, []);

  function setZone(i: number, patch: Partial<DeliveryZone>) {
    setSettings((s) => ({ ...s, deliveryZones: s.deliveryZones.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));
  }

  function addZone() {
    setSettings((s) => ({
      ...s,
      deliveryZones: [...s.deliveryZones, {
        id: newZoneId("new zone", s.deliveryZones.map((z) => z.id)),
        label: "", desc: "", type: "bike", fee: 0, active: false,
      }],
    }));
  }

  function removeZone(i: number) {
    setSettings((s) => ({ ...s, deliveryZones: s.deliveryZones.filter((_, j) => j !== i) }));
  }

  async function save() {
    const error = validate(settings);
    if (error) return toast.error(error);
    setSaving(true);
    try {
      setSettings(await savePricingSettings(settings));
      toast.success("Pricing settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const s = settings;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-header">Platform Settings</h1>
        <p className="font-josefin text-gray-500 text-sm mt-1">
          Set rates for specific partners on <Link href="/admin/pricing" className="text-teal font-semibold">Partner Rates</Link>,
          and run discounts and promo codes on <Link href="/admin/offers" className="text-teal font-semibold">Offers</Link>.
        </p>
      </div>

      {/* Delivery zones — the fees customers pay */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-1">Delivery Zones & Fees</h3>
        <p className="font-josefin text-gray-400 text-xs mb-4">
          Customers pick one of the zones that are switched on at checkout. The fee is charged by the server, so it can&apos;t be changed by the customer.
        </p>
        <div className="space-y-4">
          {s.deliveryZones.map((zone, i) => (
            <div key={zone.id} className={`rounded-2xl border p-4 ${zone.active ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-50"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Zone name</label>
                  <input className="input-field" value={zone.label} disabled={!loaded}
                    onChange={(e) => setZone(i, { label: e.target.value })} />
                </div>
                <div>
                  <label className="label">Short description</label>
                  <input className="input-field" value={zone.desc} disabled={!loaded}
                    onChange={(e) => setZone(i, { desc: e.target.value })} />
                </div>
                <div>
                  <label className="label">Delivered by</label>
                  <select className="input-field" value={zone.type} disabled={!loaded}
                    onChange={(e) => setZone(i, { type: e.target.value as DeliveryType })}>
                    {DELIVERY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Delivery fee (KES)</label>
                  <input type="number" min={0} className="input-field" value={zone.fee} disabled={!loaded}
                    onChange={(e) => setZone(i, { fee: Math.round(Number(e.target.value)) })} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 font-josefin text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={zone.active} disabled={!loaded}
                    onChange={(e) => setZone(i, { active: e.target.checked })} />
                  Available at checkout
                </label>
                <button onClick={() => removeZone(i)} disabled={!loaded}
                  className="text-red-400 hover:text-red-600 font-josefin text-sm flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addZone} disabled={!loaded}
          className="mt-3 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add delivery zone
        </button>
      </div>

      {/* Default commission & payout rates */}
      <div className="card">
        <h3 className="font-outfit font-bold text-navy mb-1">Default Commission & Payout Rates</h3>
        <p className="font-josefin text-gray-400 text-xs mb-4">
          Apply to every partner without their own rate or a running promo. New rates apply to orders placed or accepted after you save.
        </p>
        <div className="space-y-4">
          {RATE_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-josefin text-gray-700 text-sm font-semibold">{f.label}</p>
                <p className="font-josefin text-gray-400 text-xs">{f.hint}</p>
              </div>
              <input type="number" className="input-field w-24 text-right" value={s[f.key]} min={0} max={100} disabled={!loaded}
                onChange={(e) => setSettings({ ...s, [f.key]: Number(e.target.value) })} />
              <span className="font-josefin text-gray-500 text-sm">%</span>
            </div>
          ))}
        </div>
        <p className="font-josefin text-gray-400 text-xs mt-4">
          On a KES 100 delivery fee, OkoaTime keeps KES {100 - s.riderShare} on a bike delivery,
          KES {100 - s.boatShare} on a boat delivery and KES {100 - s.riderShareHandoff - s.boatShareHandoff} on a bike + boat delivery.
        </p>
      </div>

      <Button variant="primary" size="md" className="w-full" onClick={save} disabled={!loaded || saving}>
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save pricing settings"}
      </Button>
    </div>
  );
}
