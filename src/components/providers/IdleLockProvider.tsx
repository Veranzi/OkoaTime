"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useLockStore } from "@/lib/store/useLockStore";
import { completeUnlockRedirect } from "@/lib/firebase/auth";
import LockScreen from "@/components/auth/LockScreen";

const IDLE_LIMIT_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

export default function IdleLockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { locked, lock, unlock } = useLockStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Picks up the result of a Google-reauth redirect (unlock flow), if one is pending.
  useEffect(() => {
    completeUnlockRedirect()
      .then((didUnlock) => { if (didUnlock) unlock(); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(lock, IDLE_LIMIT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <>
      {children}
      {locked && user && <LockScreen />}
    </>
  );
}
