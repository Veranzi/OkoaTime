import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/firebase/auth";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),
      clearUser: () => set({ user: null, loading: false }),
    }),
    {
      name: "okoatime-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
