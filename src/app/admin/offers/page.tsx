"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Trash2, Pause, Play, Tag, Sparkles, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  createOffer, deleteOffer, getPartners, getPricingSettings, listOffers, setOfferActive, type PartnerRow,
} from "@/lib/pricing-client";
import {
  RATE_LABELS, ROLE_RATE_FIELDS, describeDiscount, isOfferLive,
  type DeliveryZone, type Offer, type PartnerRole,
} from "@/lib/pricing";
import { formatDate, type PlatformRates } from "@/lib/utils";

type FormKind = "partner_rate" | "auto_discount" | "promo_code";

const ROLE_LABELS: Record<PartnerRole, string> = { supplier: "Suppliers", rider: "Riders", boat: "Boat operators" };

function offerStatus(o: Offer): { label: string; variant: "green" | "yellow" | "gray" | "red" } {
  const now = new Date();
  if (!o.active) return { label: "Paused", variant: "gray" };
  if (o.endsAt && now >= new Date(o.endsAt)) return { label: "Ended", variant: "red" };
  if (o.kind === "customer_discount" && o.maxUses != null && o.usedCount >= o.maxUses) return { label: "Used up", variant: "red" };
  if (o.startsAt && now < new Date(o.startsAt)) return { label: "Scheduled", variant: "yellow" };
  return isOfferLive(o, now) ? { label: "Live", variant: "green" } : { label: "Inactive", variant: "gray" };
}

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

const emptyForm = {
  kind: "auto_discount" as FormKind,
  name: "",
  startsAt: "",
  endsAt: "",
  // partner promo
  role: "rider" as PartnerRole,
  targetAll: true,
  targetIds: [] as string[],
  rates: {} as Partial<Record<keyof PlatformRates, string>>,
  // customer discount
  appliesTo: "delivery" as "delivery" | "order",
  discountType: "percent" as "percent" | "amount",
  value: "",
  zoneIds: [] as string[],
  minSubtotal: "",
  code: "",
  maxUses: "",
  onePerCustomer: false,
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([listOffers(), getPricingSettings()]);
      setOffers(o);
      setZones(s.deliveryZones);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Partner list for "selected partners" targeting.
  useEffect(() => {
    if (!formOpen || form.kind !== "partner_rate") return;
    getPartners(form.role).then(setPartners).catch(() => setPartners([]));
  }, [formOpen, form.kind, form.role]);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function toggleIn(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  async function submit() {
    const f = form;
    if (!f.name.trim()) return toast.error("Give the offer a name");
    const base = { name: f.name.trim(), active: true, startsAt: toIso(f.startsAt), endsAt: toIso(f.endsAt) };

    let body: Record<string, unknown>;
    if (f.kind === "partner_rate") {
      const rates: Partial<PlatformRates> = {};
      for (const field of ROLE_RATE_FIELDS[f.role]) {
        const raw = f.rates[field]?.trim();
        if (raw) rates[field] = Number(raw);
      }
      if (Object.keys(rates).length === 0) return toast.error("Enter at least one promo rate");
      if (!f.targetAll && f.targetIds.length === 0) return toast.error("Pick at least one partner");
      body = { kind: "partner_rate", ...base, role: f.role, targetIds: f.targetAll ? null : f.targetIds, rates };
    } else {
      const value = Number(f.value);
      if (!f.value || !Number.isFinite(value) || value <= 0) return toast.error("Enter the discount amount");
      if (f.kind === "promo_code" && !f.code.trim()) return toast.error("Enter the promo code");
      body = {
        kind: "customer_discount", ...base,
        appliesTo: f.appliesTo,
        discountType: f.discountType,
        value,
        zoneIds: f.zoneIds.length ? f.zoneIds : null,
        minSubtotal: f.minSubtotal ? Number(f.minSubtotal) : null,
        code: f.kind === "promo_code" ? f.code.trim().toUpperCase() : null,
        maxUses: f.maxUses ? Number(f.maxUses) : null,
        onePerCustomer: f.onePerCustomer,
      };
    }

    setSaving(true);
    try {
      await createOffer(body);
      toast.success("Offer created");
      setForm(emptyForm);
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(o: Offer) {
    try {
      await setOfferActive(o.id, !o.active);
      setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, active: !o.active } : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update offer");
    }
  }

  async function remove(o: Offer) {
    if (!window.confirm(`Delete "${o.name}"? Orders that already used it keep their discount.`)) return;
    try {
      await deleteOffer(o.id);
      setOffers((prev) => prev.filter((x) => x.id !== o.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete offer");
    }
  }

  function describe(o: Offer): string {
    if (o.kind === "partner_rate") {
      const who = o.targetIds ? `${o.targetIds.length} selected ${ROLE_LABELS[o.role].toLowerCase()}` : `All ${ROLE_LABELS[o.role].toLowerCase()}`;
      const rates = Object.entries(o.rates).map(([k, v]) => `${RATE_LABELS[k as keyof PlatformRates]} ${v}%`).join(" · ");
      return `${who}: ${rates}`;
    }
    const parts = [describeDiscount(o)];
    if (o.zoneIds?.length) parts.push(`in ${o.zoneIds.map((id) => zones.find((z) => z.id === id)?.label ?? id).join(", ")}`);
    if (o.minSubtotal) parts.push(`orders over KES ${o.minSubtotal}`);
    if (o.onePerCustomer) parts.push("once per customer");
    if (o.maxUses != null) parts.push(`${o.usedCount}/${o.maxUses} used`);
    else parts.push(`used ${o.usedCount}×`);
    return parts.join(" · ");
  }

  const f = form;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-header">Offers</h1>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button variant="primary" size="sm" onClick={() => setFormOpen((o) => !o)}>
            <Plus className="w-4 h-4" /> New offer
          </Button>
        </div>
      </div>
      <p className="font-josefin text-gray-500 text-sm mb-6">
        Customer discounts are paid for by OkoaTime — suppliers, riders and boat operators earn the same as without the offer.
        For permanent partner rates use <Link href="/admin/pricing" className="text-teal font-semibold">Partner Rates</Link>.
      </p>

      {formOpen && (
        <div className="card mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {([
              ["auto_discount", "Customer discount", Tag],
              ["promo_code", "Promo code", Ticket],
              ["partner_rate", "Partner promo rate", Sparkles],
            ] as const).map(([k, label, Icon]) => (
              <button key={k} onClick={() => set("kind", k)}
                className={`px-3 py-2 rounded-xl font-josefin text-sm font-semibold flex items-center gap-1.5 ${f.kind === k ? "bg-navy text-white" : "bg-gray-100 text-gray-600"}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="label">Name</label>
              <input className="input-field" value={f.name} onChange={(e) => set("name", e.target.value)}
                placeholder={f.kind === "partner_rate" ? "Weekend rider boost" : "Free delivery in Shela"} />
            </div>
            <div>
              <label className="label">Starts (optional)</label>
              <input type="datetime-local" className="input-field" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </div>
            <div>
              <label className="label">Ends (optional)</label>
              <input type="datetime-local" className="input-field" value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </div>
          </div>

          {f.kind === "partner_rate" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Partners</label>
                  <select className="input-field" value={f.role}
                    onChange={(e) => setForm((x) => ({ ...x, role: e.target.value as PartnerRole, targetIds: [], rates: {} }))}>
                    {(Object.keys(ROLE_LABELS) as PartnerRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                {ROLE_RATE_FIELDS[f.role].map((field) => (
                  <div key={field}>
                    <label className="label">{RATE_LABELS[field]} (%)</label>
                    <input type="number" min={0} max={100} className="input-field" value={f.rates[field] ?? ""}
                      onChange={(e) => set("rates", { ...f.rates, [field]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 font-josefin text-sm text-gray-700">
                <label className="flex items-center gap-2"><input type="radio" checked={f.targetAll} onChange={() => set("targetAll", true)} /> All {ROLE_LABELS[f.role].toLowerCase()}</label>
                <label className="flex items-center gap-2"><input type="radio" checked={!f.targetAll} onChange={() => set("targetAll", false)} /> Selected ({f.targetIds.length})</label>
              </div>
              {!f.targetAll && (
                <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1">
                  {partners.length === 0 && <p className="font-josefin text-gray-400 text-sm p-2">No partners found</p>}
                  {partners.map((p) => (
                    <label key={p.uid} className="flex items-center gap-2 font-josefin text-sm p-1 cursor-pointer">
                      <input type="checkbox" checked={f.targetIds.includes(p.uid)} onChange={() => set("targetIds", toggleIn(f.targetIds, p.uid))} />
                      {p.displayName || p.name}
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Discount on</label>
                  <select className="input-field" value={f.appliesTo} onChange={(e) => set("appliesTo", e.target.value as "delivery" | "order")}>
                    <option value="delivery">Delivery fee</option>
                    <option value="order">Order items</option>
                  </select>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input-field" value={f.discountType} onChange={(e) => set("discountType", e.target.value as "percent" | "amount")}>
                    <option value="percent">Percentage (%)</option>
                    <option value="amount">Fixed amount (KES)</option>
                  </select>
                </div>
                <div>
                  <label className="label">{f.discountType === "percent" ? "Percent off (100 = free)" : "KES off"}</label>
                  <input type="number" min={0} className="input-field" value={f.value} onChange={(e) => set("value", e.target.value)} />
                </div>
                <div>
                  <label className="label">Minimum order (KES, optional)</label>
                  <input type="number" min={0} className="input-field" value={f.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} />
                </div>
                <div>
                  <label className="label">Max total uses (optional)</label>
                  <input type="number" min={1} className="input-field" value={f.maxUses} onChange={(e) => set("maxUses", e.target.value)} />
                </div>
                {f.kind === "promo_code" && (
                  <div>
                    <label className="label">Promo code</label>
                    <input className="input-field uppercase" value={f.code} placeholder="KARIBU50" onChange={(e) => set("code", e.target.value)} />
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 font-josefin text-sm text-gray-700">
                <input type="checkbox" checked={f.onePerCustomer} onChange={(e) => set("onePerCustomer", e.target.checked)} />
                Each customer can use this once
              </label>
              <div>
                <p className="label">Delivery zones (none ticked = all zones)</p>
                <div className="flex flex-wrap gap-3">
                  {zones.map((z) => (
                    <label key={z.id} className="flex items-center gap-2 font-josefin text-sm text-gray-700">
                      <input type="checkbox" checked={f.zoneIds.includes(z.id)} onChange={() => set("zoneIds", toggleIn(f.zoneIds, z.id))} />
                      {z.label || z.id}
                    </label>
                  ))}
                </div>
              </div>
              <p className="font-josefin text-gray-400 text-xs">
                {f.kind === "promo_code" ? "Customers type the code at checkout." : "Applied automatically at checkout to every order that qualifies."}{" "}
                When several offers qualify, the customer gets the single best delivery discount and the single best order discount.
              </p>
            </>
          )}

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={submit} disabled={saving}>{saving ? "Saving..." : "Create offer"}</Button>
            <Button variant="secondary" size="sm" onClick={() => { setForm(emptyForm); setFormOpen(false); }}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="card animate-pulse h-20 bg-gray-50" />)}</div>
      ) : offers.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-outfit font-bold text-navy">No offers yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => {
            const status = offerStatus(o);
            const kindLabel = o.kind === "partner_rate" ? "Partner promo" : o.code ? `Code ${o.code}` : "Customer discount";
            return (
              <div key={o.id} className="card flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-outfit font-bold text-navy">{o.name}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="font-josefin text-gray-400 text-xs">{kindLabel}</span>
                  </div>
                  <p className="font-josefin text-gray-600 text-sm">{describe(o)}</p>
                  <p className="font-josefin text-gray-400 text-xs mt-1">
                    {o.startsAt ? `From ${formatDate(new Date(o.startsAt))}` : "From now"}
                    {o.endsAt ? ` until ${formatDate(new Date(o.endsAt))}` : " · no end date"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(o)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" title={o.active ? "Pause" : "Resume"}>
                    {o.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(o)} className="p-2 rounded-xl hover:bg-red-50 text-red-400" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
