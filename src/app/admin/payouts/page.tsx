"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Check, X } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { getAllPayoutRequests, updatePayoutRequest, tsToDate } from "@/lib/firebase/db";
import type { PayoutRequest } from "@/lib/firebase/db";

const statusBadge: Record<string, "yellow" | "green" | "red"> = {
  pending: "yellow", paid: "green", rejected: "red",
};

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [modal, setModal] = useState<{ req: PayoutRequest; action: "paid" | "rejected" } | null>(null);
  const [mpesaRef, setMpesaRef] = useState("");
  const [adminNote, setAdminNote] = useState("");

  async function load() {
    setLoading(true);
    try { setRequests(await getAllPayoutRequests()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function confirm() {
    if (!modal) return;
    if (modal.action === "paid" && !mpesaRef.trim()) return toast.error("Enter the M-Pesa reference");
    setProcessing(modal.req.id);
    try {
      await updatePayoutRequest(modal.req.id, {
        status: modal.action,
        ...(mpesaRef.trim() ? { mpesaRef: mpesaRef.trim() } : {}),
        ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
      });
      setRequests((prev) => prev.map((r) =>
        r.id === modal.req.id ? { ...r, status: modal.action, mpesaRef: mpesaRef || r.mpesaRef, adminNote: adminNote || r.adminNote } : r
      ));
      toast.success(modal.action === "paid" ? "Payout marked as paid!" : "Request rejected.");
      setModal(null);
      setMpesaRef("");
      setAdminNote("");
    } catch {
      toast.error("Failed to update request.");
    } finally {
      setProcessing(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const done = requests.filter((r) => r.status !== "pending");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Payout Requests</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {pending.length} pending · {formatKES(totalPending)} to pay out
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-outfit font-bold text-navy mb-3">Pending Payment</h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="card border-l-4 border-l-orange flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-josefin text-xs text-gray-400 uppercase tracking-wide">{req.userRole}</span>
                    <Badge variant="yellow">Pending</Badge>
                  </div>
                  <p className="font-outfit font-bold text-navy">{req.userName}</p>
                  <p className="font-josefin text-gray-500 text-sm">M-Pesa: <strong>{req.phone}</strong></p>
                  <p className="font-josefin text-gray-400 text-xs">{formatDate(tsToDate(req.createdAt))}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-outfit font-black text-navy text-xl">{formatKES(req.amount)}</p>
                  <Button variant="primary" size="sm" onClick={() => { setModal({ req, action: "paid" }); setMpesaRef(""); setAdminNote(""); }}>
                    <Check className="w-3.5 h-3.5" /> Mark Paid
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => { setModal({ req, action: "rejected" }); setMpesaRef(""); setAdminNote(""); }}>
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-outfit font-bold text-navy mb-3">History</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="card animate-pulse h-20 bg-gray-50" />)}</div>
        ) : done.length === 0 && pending.length === 0 ? (
          <div className="card text-center py-12 font-josefin text-gray-400">No payout requests yet</div>
        ) : done.length === 0 ? (
          <div className="card text-center py-8 font-josefin text-gray-400">No completed payouts yet</div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Name", "Role", "M-Pesa", "Amount", "Ref", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left font-outfit font-semibold text-gray-400 text-xs p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {done.map((req) => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-josefin font-semibold text-navy">{req.userName}</td>
                    <td className="p-4 font-josefin text-gray-500 capitalize text-xs">{req.userRole}</td>
                    <td className="p-4 font-josefin text-gray-500">{req.phone}</td>
                    <td className="p-4 font-outfit font-bold text-navy">{formatKES(req.amount)}</td>
                    <td className="p-4 font-josefin text-teal text-xs">{req.mpesaRef ?? "—"}</td>
                    <td className="p-4"><Badge variant={statusBadge[req.status]}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</Badge></td>
                    <td className="p-4 font-josefin text-gray-400 text-xs whitespace-nowrap">{formatDate(tsToDate(req.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-outfit font-bold text-xl text-navy mb-1">
              {modal.action === "paid" ? "Confirm Payment" : "Reject Request"}
            </h3>
            <p className="font-josefin text-gray-500 text-sm mb-4">
              {modal.req.userName} · {formatKES(modal.req.amount)} → {modal.req.phone}
            </p>

            {modal.action === "paid" && (
              <div className="mb-3">
                <label className="label">M-Pesa Reference (required)</label>
                <input className="input-field" placeholder="e.g. QHX3K9P1ZR" value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} />
              </div>
            )}
            <div className="mb-4">
              <label className="label">Note (optional)</label>
              <input className="input-field" placeholder="Any message to the recipient..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant={modal.action === "paid" ? "primary" : "danger"}
                size="sm"
                className="flex-1"
                loading={processing === modal.req.id}
                onClick={confirm}
              >
                {modal.action === "paid" ? "Confirm Paid" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
