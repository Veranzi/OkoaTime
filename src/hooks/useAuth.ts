"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUserProfile, setSessionCookie, clearSessionCookie } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
          setSessionCookie(); // refresh cookie whenever Firebase confirms auth
        } catch {
          setUser(null);
          clearSessionCookie();
        }
      } else {
        setUser(null);
        clearSessionCookie();
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return { user, loading };
}
