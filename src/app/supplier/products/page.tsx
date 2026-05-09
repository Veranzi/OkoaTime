"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Upload, ImageIcon, Loader2 } from "lucide-react";
import { formatKES } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getProductsBySupplier, addProduct, updateProduct, deleteProduct } from "@/lib/firebase/db";
import type { Product } from "@/lib/firebase/db";

type DraftProduct = Partial<Omit<Product, "id" | "supplierId" | "supplierName" | "createdAt">>;

export default function SupplierProductsPage() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftProduct & { id?: string }>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    try { setProducts(await getProductsBySupplier(user.uid)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user?.uid]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  function openAdd() {
    setDraft({ available: true, category: user?.serviceCategory ?? "seafood" });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setDraft({
      id: p.id, name: p.name, category: p.category, price: p.price,
      unit: p.unit, available: p.available, description: p.description,
      imageUrl: p.imageUrl,
    });
    setModalOpen(true);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");

      setDraft((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success("Photo uploaded");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function toggleAvailability(p: Product) {
    try {
      await updateProduct(p.id, { available: !p.available });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, available: !p.available } : x));
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete"); }
  }

  async function saveProduct() {
    if (!draft.name || !draft.price) return toast.error("Name and price are required");
    if (!user?.uid) return toast.error("Not logged in");
    setSaving(true);
    try {
      if (draft.id) {
        const { id, ...rest } = draft;
        const cleanRest = Object.fromEntries(
          Object.entries(rest).filter(([, v]) => v !== undefined)
        ) as typeof rest;
        await updateProduct(id, cleanRest);
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...cleanRest } as Product : p));
        toast.success("Product updated");
      } else {
        await addProduct({
          supplierId: user.uid,
          supplierName: user.businessName ?? user.name ?? "",
          name: draft.name!,
          category: draft.category ?? user.serviceCategory ?? "seafood",
          price: draft.price!,
          unit: draft.unit ?? "piece",
          available: draft.available ?? true,
          ...(draft.description ? { description: draft.description } : {}),
          ...(draft.imageUrl ? { imageUrl: draft.imageUrl } : {}),
        });
        await load();
        toast.success("Product added");
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("saveProduct error:", err);
      if (msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
        toast.error("Permission denied — check Firestore rules");
      } else {
        toast.error(`Failed: ${msg.slice(0, 80)}`);
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">My Products</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{products.length} products listed</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input className="input-field pl-10" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-52 bg-gray-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-outfit font-bold text-navy mb-1">No products yet</p>
          <p className="font-josefin text-gray-400 text-sm mb-4">Add your first product to start receiving orders.</p>
          <Button variant="primary" size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Product</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className={`card overflow-hidden p-0 ${!product.available ? "opacity-60" : ""}`}>
              {/* Product image */}
              <div className="relative h-36 bg-gray-100">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                {/* Availability toggle overlay */}
                <button
                  onClick={() => toggleAvailability(product)}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg shadow transition-colors ${
                    product.available ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title={product.available ? "Mark unavailable" : "Mark available"}
                >
                  {product.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-outfit font-bold text-navy text-sm mb-1">{product.name}</h3>
                {product.description && <p className="font-josefin text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-outfit font-bold text-orange text-lg">{formatKES(product.price)}</p>
                    <p className="font-josefin text-gray-400 text-xs">per {product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <span className={`mt-2 inline-block text-xs font-josefin font-semibold px-2 py-0.5 rounded-full ${product.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {product.available ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={draft.id ? "Edit Product" : "Add Product"}>
        <div className="space-y-4">

          <Input
            label="Product Name"
            placeholder="e.g., Grilled Tuna (500g)"
            value={draft.name ?? ""}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          />
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={draft.category ?? "seafood"} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}>
              <option value="seafood">Seafood</option>
              <option value="groceries">Groceries</option>
              <option value="fruits_veg">Fruits &amp; Vegetables</option>
              <option value="household">Household Items</option>
            </select>
          </div>
          <Input
            label="Price (KES)"
            type="number"
            placeholder="450"
            value={draft.price ?? ""}
            onChange={(e) => setDraft((p) => ({ ...p, price: Number(e.target.value) }))}
          />
          <Input
            label="Unit"
            placeholder="e.g., piece, kg, pack"
            value={draft.unit ?? ""}
            onChange={(e) => setDraft((p) => ({ ...p, unit: e.target.value }))}
          />
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input-field resize-none h-20"
              placeholder="Brief product description..."
              value={draft.description ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="label">Product Photo (optional)</label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-colors ${
                uploading ? "border-orange/40 bg-orange-50/30 cursor-wait" : "border-gray-200 hover:border-orange cursor-pointer"
              }`}
            >
              {draft.imageUrl ? (
                <div className="relative h-40">
                  <Image src={draft.imageUrl} alt="Product preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="font-josefin text-white text-sm font-semibold flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Change photo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-2">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-orange animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-300" />
                  )}
                  <p className="font-josefin text-gray-400 text-sm">
                    {uploading ? "Uploading..." : "Tap to upload a photo"}
                  </p>
                  <p className="font-josefin text-gray-300 text-xs">JPG, PNG · Max 5 MB</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="w-8 h-8 text-orange animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={saveProduct} loading={saving || uploading}>
              {draft.id ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
