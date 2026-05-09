import { create } from "zustand";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface NewOrderState {
  step: number;
  category: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  paymentMethod: "mpesa" | "cash";
  phone: string;
  notes: string;
  setStep: (step: number) => void;
  setCategory: (category: string) => void;
  setSupplier: (supplierId: string, supplierName: string) => void;
  setItems: (items: OrderItem[]) => void;
  setDelivery: (address: string, lat?: number, lng?: number) => void;
  setPayment: (method: "mpesa" | "cash", phone: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

export const useOrderStore = create<NewOrderState>()((set) => ({
  step: 1,
  category: "",
  supplierId: "",
  supplierName: "",
  items: [],
  deliveryAddress: "",
  paymentMethod: "mpesa",
  phone: "",
  notes: "",
  setStep: (step) => set({ step }),
  setCategory: (category) => set({ category }),
  setSupplier: (supplierId, supplierName) => set({ supplierId, supplierName }),
  setItems: (items) => set({ items }),
  setDelivery: (deliveryAddress, deliveryLat, deliveryLng) =>
    set({ deliveryAddress, deliveryLat, deliveryLng }),
  setPayment: (paymentMethod, phone) => set({ paymentMethod, phone }),
  setNotes: (notes) => set({ notes }),
  reset: () =>
    set({
      step: 1,
      category: "",
      supplierId: "",
      supplierName: "",
      items: [],
      deliveryAddress: "",
      paymentMethod: "mpesa",
      phone: "",
      notes: "",
    }),
}));
