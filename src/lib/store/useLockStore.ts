import { create } from "zustand";

// Not persisted — a fresh page load already re-establishes trust via the
// normal auth/middleware checks, so the lock only needs to track inactivity
// within a single continuous session.
interface LockState {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
}

export const useLockStore = create<LockState>((set) => ({
  locked: false,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
