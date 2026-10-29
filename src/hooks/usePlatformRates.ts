"use client";
import { useEffect, useState } from "react";
import { getMyRates, getPlatformRates, type MyRates } from "@/lib/pricing-client";
import { DEFAULT_PLATFORM_RATES, type PlatformRates } from "@/lib/utils";

// Rates for display. Pages that *write* a payout should call getMyRates() at
// that moment instead, so they never record the defaults while this loads.

/** Platform default rates — for admin pages. */
export function usePlatformRates() {
  const [rates, setRates] = useState<PlatformRates>(DEFAULT_PLATFORM_RATES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPlatformRates()
      .then(setRates)
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  return { rates, loaded };
}

/** The signed-in partner's own effective rates (promo > own rate > default). */
export function useMyRates() {
  const [my, setMy] = useState<MyRates | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getMyRates()
      .then(setMy)
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  return { rates: my?.rates ?? DEFAULT_PLATFORM_RATES, promo: my?.promo ?? null, overrides: my?.overrides ?? {}, loaded, failed: loaded && !my };
}
