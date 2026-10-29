"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, RotateCcw, Check } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { applyPartnerRates, getPartners, getPlatformRates, type PartnerRow } from "@/lib/pricing-client";
import { RATE_LABELS, ROLE_RATE_FIELDS, type PartnerRole } from "@/lib/pricing";
import { DEFAULT_PLATFORM_RATES, formatDate, type PlatformRates } from "@/lib/utils";

const ROLES: { id: PartnerRole; label: string }[] = [
  { id: "supplier", label: "Suppliers" },
  { id: "rider", label: "Riders" },
  { id: "boat", label: "Boat operators" },
];

export default function AdminPartnerRatesPage() {
  const [role, setRole] = useState<PartnerRole>("supplier");
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [defaults, setDefaults] = useState<PlatformRates>(DEFAULT_PLATFORM_RATES);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<"selected" | "all">("selected");
  const [draft, setDraft] = useState<Partial<Record<keyof PlatformRates, string>>>({});
  const [clearOverrides, setClearOverrides] = useState(false);
  const [busy, setBusy] = useState(false);

  const fields = ROLE_RATE_FIELDS[role];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, d] = await Promise.all([getPartners(role), getPlatformRates()]);
      setPartners(rows);
      setDefaults(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    setSelected(new Set());
    setDraft({});
    setTarget("selected");
    setClearOverrides(false);
    load();
  }, [load]);

  const allSelected = partners.length > 0 && selected.size === partners.length;

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }

  function parsedRates(): Partial<PlatformRates> | null {
    const out: Partial<PlatformRates> = {};
    for (const f of fields) {
      const raw = draft[f]?.trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        toast.error(`${RATE_LABELS[f]} must be between 0 and 100`);
        return null;
      }
      out[f] = n;
    }
    if (Object.keys(out).length === 0) {
      toast.error("Enter at least one rate");
      return null;
    }
    return out;
  }

  async function apply() {
    const rates = parsedRates();
    if (!rates) return;
    if (target === "selected" && selected.size === 0) return toast.error("Tick the partners you want to change");
    const who = target === "all" ? `all ${ROLES.find((r) => r.id === role)!.label.toLowerCase()}` : `${selected.size} selected`;
    if (!window.confirm(`Apply these rates to ${who}?`)) return;
    setBusy(true);
    try {
      const n = await applyPartnerRates({
        role, target, action: "set", rates,
        ...(target === "selected" ? { uids: Array.from(selected) } : { clearOverrides }),
      });
      toast.success(target === "all" ? "Default rate updated" : `Updated ${n} partner${n === 1 ? "" : "s"}`);
      setDraft({});
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply rates");
    } finally {
      setBusy(false);
    }
  }

  async function resetSelected() {
    if (selected.size === 0) return toast.error("Tick the partners to reset");
    if (!window.confirm(`Reset ${selected.size} partner${selected.size === 1 ? "" : "s"} to the default rate?`)) return;
    setBusy(true);
    try {
      await applyPartnerRates({ role, target: "selected", action: "reset", uids: Array.from(selected) });
      toast.success("Reset to the default rate");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-header">Partner Rates</h1>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="font-josefin text-gray-500 text-sm mb-6">
        Give everyone or selected partners their own rate. A partner&apos;s own rate stays until you change or reset it.
        For a time-limited rate, create a partner promo on <Link href="/admin/offers" className="text-teal font-semibold">Offers</Link>.
      </p>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)}
            className={`px-4 py-2 rounded-xl font-josefin text-sm font-semibold transition-colors ${role === r.id ? "bg-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Apply panel */}
      <div className="card mb-6">
        <h3 className="font-outfit font-bold text-navy mb-3">Set rates</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {fields.map((f) => (
            <div key={f}>
              <label className="label">{RATE_LABELS[f]}</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} className="input-field w-24 text-right"
                  placeholder={String(defaults[f])} value={draft[f] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f]: e.target.value }))} />
                <span className="font-josefin text-gray-500 text-sm">%</span>
              </div>
              <p className="font-josefin text-gray-400 text-xs mt-1">Default: {defaults[f]}%</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-4 font-josefin text-sm text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={target === "selected"} onChange={() => setTarget("selected")} />
            Selected partners ({selected.size})
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={target === "all"} onChange={() => setTarget("all")} />
            Everyone (changes the default)
          </label>
        </div>
        {target === "all" && (
          <label className="flex items-center gap-2 font-josefin text-sm text-gray-600 mb-4 cursor-pointer">
            <input type="checkbox" checked={clearOverrides} onChange={(e) => setClearOverrides(e.target.checked)} />
            Also remove individual rates, so every partner gets this rate
          </label>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={apply} disabled={busy || loading}>
            <Check className="w-4 h-4" /> Apply rates
          </Button>
          <Button variant="secondary" size="sm" onClick={resetSelected} disabled={busy || loading || selected.size === 0}>
            <RotateCcw className="w-4 h-4" /> Reset selected to default
          </Button>
        </div>
      </div>

      {/* Partner list */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-teal border-t-transparent rounded-full mx-auto" /></div>
        ) : partners.length === 0 ? (
          <div className="p-8 text-center font-josefin text-gray-400">No {ROLES.find((r) => r.id === role)!.label.toLowerCase()} yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 text-left">
                    <input type="checkbox" aria-label="Select all" checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(partners.map((p) => p.uid)))} />
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3">Partner</th>
                  <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-3">Status</th>
                  {fields.map((f) => (
                    <th key={f} className="text-left font-outfit font-semibold text-gray-400 text-xs p-3 whitespace-nowrap">{RATE_LABELS[f]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.uid} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => toggle(p.uid)}>
                    <td className="p-3"><input type="checkbox" checked={selected.has(p.uid)} onChange={() => toggle(p.uid)} onClick={(e) => e.stopPropagation()} /></td>
                    <td className="p-3">
                      <p className="font-josefin font-semibold text-navy">{p.displayName || p.name}</p>
                      {p.displayName !== p.name && <p className="font-josefin text-gray-400 text-xs">{p.name}</p>}
                      {p.promo && (
                        <p className="font-josefin text-orange text-xs flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3" /> {p.promo.name}{p.promo.endsAt ? ` · until ${formatDate(new Date(p.promo.endsAt))}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={p.status === "active" ? "green" : p.status === "pending" ? "yellow" : "red"}>{p.status || "—"}</Badge>
                    </td>
                    {fields.map((f) => {
                      const fromPromo = p.promo && typeof p.promo.rates[f] === "number";
                      const own = typeof p.overrides[f] === "number";
                      return (
                        <td key={f} className="p-3 whitespace-nowrap">
                          <span className="font-outfit font-bold text-navy">{p.rates[f]}%</span>{" "}
                          <span className={`font-josefin text-xs ${fromPromo ? "text-orange" : own ? "text-teal" : "text-gray-400"}`}>
                            {fromPromo ? "promo" : own ? "own rate" : "default"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
