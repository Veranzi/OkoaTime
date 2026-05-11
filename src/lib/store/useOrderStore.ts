import { create } from "zustand";
import type { DeliveryType } from "@/lib/firebase/db";

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
  deliveryType: DeliveryType;
  deliveryFee: number;
  deliveryZoneId: string;
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
  setDeliveryZone: (zoneId: string, type: DeliveryType, fee: number) => void;
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
  deliveryType: "bike",
  deliveryFee: 0,
  deliveryZoneId: "",
  deliveryAddress: "",
  paymentMethod: "mpesa",
  phone: "",
  notes: "",
  setStep: (step) => set({ step }),
  setCategory: (category) => set({ category }),
  setSupplier: (supplierId, supplierName) => set({ supplierId, supplierName }),
  setItems: (items) => set({ items }),
  setDeliveryZone: (deliveryZoneId, deliveryType, deliveryFee) =>
    set({ deliveryZoneId, deliveryType, deliveryFee }),
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
      deliveryType: "bike",
      deliveryFee: 0,
      deliveryZoneId: "",
      deliveryAddress: "",
      paymentMethod: "mpesa",
      phone: "",
      notes: "",
    }),
}));
