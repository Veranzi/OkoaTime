"use client";
import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { formatKES } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description: string;
  emoji: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Grilled Tuna (500g)", category: "seafood", price: 450, available: true, description: "Freshly grilled tuna from Lamu waters", emoji: "🐟" },
  { id: "2", name: "King Prawns (300g)", category: "seafood", price: 680, available: true, description: "Large fresh prawns, cleaned and ready", emoji: "🦐" },
  { id: "3", name: "Lobster (1kg)", category: "seafood", price: 1200, available: false, description: "Live lobster, market price may vary", emoji: "🦞" },
  { id: "4", name: "Snapper Fish (1kg)", category: "seafood", price: 380, available: true, description: "Red snapper, whole or filleted", emoji: "🐠" },
];

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditProduct({ available: true });
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setModalOpen(true);
  }

  function toggleAvailability(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function saveProduct() {
    if (!editProduct.name || !editProduct.price) return;
    if (editProduct.id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editProduct.id ? { ...p, ...editProduct } as Product : p))
      );
    } else {
      setProducts((prev) => [...prev, { ...editProduct, id: Date.now().toString(), emoji: "📦" } as Product]);
    }
    setModalOpen(false);
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          className="input-field pl-10"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className={`card ${!product.available ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{product.emoji}</span>
              <button
                onClick={() => toggleAvailability(product.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  product.available
                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                title={product.available ? "Mark unavailable" : "Mark available"}
              >
                {product.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <h3 className="font-outfit font-bold text-navy text-sm mb-1">{product.name}</h3>
            <p className="font-josefin text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <p className="font-outfit font-bold text-orange text-lg">{formatKES(product.price)}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(product)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className={`mt-2 inline-block text-xs font-josefin font-semibold px-2 py-0.5 rounded-full ${
              product.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {product.available ? "Available" : "Unavailable"}
            </span>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct.id ? "Edit Product" : "Add Product"}>
        <div className="space-y-4">
          <Input
            label="Product Name"
            placeholder="e.g., Grilled Tuna (500g)"
            value={editProduct.name ?? ""}
            onChange={(e) => setEditProduct((p) => ({ ...p, name: e.target.value }))}
          />
          <div>
            <label className="label">Category</label>
            <select
              className="input-field"
              value={editProduct.category ?? "seafood"}
              onChange={(e) => setEditProduct((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="seafood">Seafood</option>
              <option value="groceries">Groceries</option>
              <option value="fruits_veg">Fruits & Vegetables</option>
              <option value="household">Household Items</option>
            </select>
          </div>
          <Input
            label="Price (KES)"
            type="number"
            placeholder="450"
            value={editProduct.price ?? ""}
            onChange={(e) => setEditProduct((p) => ({ ...p, price: Number(e.target.value) }))}
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field resize-none h-20"
              placeholder="Brief product description..."
              value={editProduct.description ?? ""}
              onChange={(e) => setEditProduct((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={saveProduct}>
              {editProduct.id ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
