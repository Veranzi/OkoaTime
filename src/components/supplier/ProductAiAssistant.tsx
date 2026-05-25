"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, Send, ImagePlus, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatKES } from "@/lib/utils";

export interface ProposedProduct {
  name: string;
  category: string;
  subcategory: string;
  unit: string;
  suggestedPrice: number;
  description: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  products?: ProposedProduct[];
}

const CATEGORY_LABELS: Record<string, string> = {
  seafood: "Seafood",
  groceries: "Groceries",
  fruits_veg: "Fruits & Veg",
  household: "Household",
};

export default function ProductAiAssistant({ onUseProduct }: { onUseProduct: (p: ProposedProduct) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setAttached(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send() {
    if (!input.trim() && !attached) return;
    const userMsg: ChatMessage = { role: "user", text: input.trim(), imageUrl: attached ?? undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setAttached(null);
    setSending(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, text: m.text, imageUrl: m.imageUrl })),
        }),
      });
      const data = (await res.json()) as { reply?: string; products?: ProposedProduct[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Assistant failed");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply ?? "", products: data.products ?? [] },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assistant failed");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && !uploading) send();
    }
  }

  return (
    <div className="card mb-6 p-0 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-teal/5 transition-colors"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal/10 text-teal">
          <Sparkles className="w-4 h-4" />
        </span>
        <span className="flex-1">
          <span className="block font-outfit font-bold text-navy text-sm">AI Stock Assistant</span>
          <span className="block font-josefin text-gray-400 text-xs">
            Describe or photograph your stock — I&apos;ll help you list it
          </span>
        </span>
        <span className="font-josefin text-teal text-xs font-semibold">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="max-h-80 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="font-josefin text-gray-400 text-sm text-center py-6">
                Try: &ldquo;I have fresh red snapper and 5kg bags of rice&rdquo; — or attach a photo of your stock.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.role === "user" ? "bg-navy text-white" : "bg-gray-50 text-navy"
                  }`}
                >
                  {m.imageUrl && (
                    <div className="relative w-40 h-28 mb-2 rounded-lg overflow-hidden">
                      <Image src={m.imageUrl} alt="attachment" fill className="object-cover" />
                    </div>
                  )}
                  {m.text && <p className="font-josefin text-sm whitespace-pre-wrap">{m.text}</p>}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p, j) => (
                        <div key={j} className="bg-white border border-gray-200 rounded-xl p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-outfit font-bold text-navy text-sm truncate">{p.name}</p>
                              <p className="font-josefin text-gray-400 text-xs">
                                {CATEGORY_LABELS[p.category] ?? p.category}
                                {p.subcategory ? ` · ${p.subcategory}` : ""} · per {p.unit}
                              </p>
                              {p.suggestedPrice > 0 && (
                                <p className="font-outfit font-bold text-orange text-sm mt-0.5">
                                  ~{formatKES(p.suggestedPrice)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => onUseProduct(p)}
                              className="shrink-0 inline-flex items-center gap-1 bg-teal text-white text-xs font-josefin font-semibold px-2.5 py-1.5 rounded-lg hover:bg-teal-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-2xl px-3 py-2 flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-josefin text-sm">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-3">
            {attached && (
              <div className="relative inline-block mb-2">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <Image src={attached} alt="attached" fill className="object-cover" />
                </div>
                <button
                  onClick={() => setAttached(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-teal hover:border-teal transition-colors disabled:opacity-60"
                title="Attach a photo"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAttach} />
              <input
                className="input-field flex-1"
                placeholder="Describe what you have…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button
                onClick={send}
                disabled={sending || uploading || (!input.trim() && !attached)}
                className="shrink-0 p-2.5 rounded-xl bg-orange text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
