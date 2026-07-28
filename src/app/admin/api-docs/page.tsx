"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Copy, Check } from "lucide-react";
import "swagger-ui-react/swagger-ui.css";
import { auth } from "@/lib/firebase/config";
import { paymentsOpenApiSpec } from "@/payments/openapi/payments.openapi";
import Button from "@/components/ui/Button";

// swagger-ui-react touches window at import time — must be client-only.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyMyToken() {
    setError(null);
    try {
      if (!auth.currentUser) {
        setError("You're not signed in on this browser session.");
        return;
      }
      const idToken = await auth.currentUser.getIdToken();
      setToken(idToken);
      await navigator.clipboard.writeText(idToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Could not get an ID token — try refreshing and signing in again.");
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="page-header mb-4">Payments API Docs</h1>

      <div className="card p-4 mb-4 border-2 border-red-200 bg-red-50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-outfit font-bold text-red-700 text-sm">This hits live endpoints on this deployment</p>
          <p className="font-josefin text-red-600 text-xs mt-1">
            &ldquo;Try it out&rdquo; below sends real requests using whatever Safaricom credentials (MPESA_ENV)
            are configured here. If that&apos;s <strong>production</strong>, a successful stkpush call sends a
            real STK prompt for the real order total, and completing the PIN moves real money. Only call
            stkpush with an order you own and are prepared to pay for.
          </p>
        </div>
      </div>

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <p className="font-outfit font-bold text-navy text-sm">Your Firebase ID token</p>
          <p className="font-josefin text-gray-500 text-xs mt-0.5">
            Paste this into the &ldquo;Authorize&rdquo; button below (as-is, no &ldquo;Bearer&rdquo; prefix needed —
            Swagger adds it) to call the protected endpoints as yourself.
          </p>
          {error && <p className="font-josefin text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={copyMyToken}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy my ID token"}
        </Button>
      </div>

      {token && (
        <div className="card p-3 mb-6 bg-gray-50 overflow-x-auto">
          <code className="font-mono text-xs text-gray-500 break-all">{token}</code>
        </div>
      )}

      <div className="card p-2">
        <SwaggerUI spec={paymentsOpenApiSpec} />
      </div>
    </div>
  );
}
