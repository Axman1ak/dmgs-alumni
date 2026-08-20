"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ngn } from "@/lib/format";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

/**
 * The "annual dues" card. Amount is fixed by the association and pinned
 * server-side; nothing here can change what's charged.
 */
export function DuesCard({
  userEmail,
  year,
  amount,
  classLabel,
  paid,
  memberCount,
  paidCount,
}: {
  userEmail: string;
  year: number;
  amount: number | null;
  classLabel: string | null;
  paid: boolean;
  memberCount: number;
  paidCount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(paid);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(PUBLIC_KEY);
  const pct = memberCount > 0 ? Math.min(100, Math.round((paidCount / memberCount) * 100)) : 0;

  async function pay() {
    if (!configured || amount === null) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const reference = `DUES-${year}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { error: insErr } = await supabase.from("donations").insert({
      kind: "dues",
      currency: "NGN",
      paystack_reference: reference,
    });
    if (insErr) {
      setBusy(false);
      setError(insErr.message);
      return;
    }
    try {
      await loadPaystack();
      const handler = window.PaystackPop.setup({
        key: PUBLIC_KEY,
        email: userEmail,
        amount: Math.round(amount * 100),
        currency: "NGN",
        ref: reference,
        metadata: { purpose: "dues", period_year: year },
        callback: () => setDone(true),
        onClose: () => setBusy(false),
      });
      handler.openIframe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed to start.");
    } finally {
      setBusy(false);
    }
  }

  // Amount not configured yet.
  if (amount === null) {
    return (
      <div className="border border-border bg-cream p-6">
        <p className="text-[15px] text-ink-soft">
          The {year} dues amount hasn&rsquo;t been set yet. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid border border-border bg-cream md:grid-cols-[1.1fr_1fr]">
      {/* Left: what it is */}
      <div className="border-b border-border p-7 sm:p-8 md:border-b-0 md:border-r">
        {done ? (
          <span className="inline-flex items-center gap-2 border border-success px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            Paid for {year}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 border border-gold-500 bg-gold-500/10 px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-500">
            <span className="h-2 w-2 rounded-full bg-gold-500" />
            Not paid for {year}
          </span>
        )}
        <div className="mt-4 font-display text-[44px] font-semibold leading-none text-emerald-900">
          {ngn(amount)}
        </div>
        <div className="mt-1 font-sans text-[13px] text-ink-muted">
          {classLabel ?? "Your class"} · {year}
        </div>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
          Your yearly membership contribution to your class.
        </p>
      </div>

      {/* Right: participation + action */}
      <div className="flex flex-col justify-center bg-paper p-7 sm:p-8">
        {memberCount > 0 && (
          <>
            <div className="mb-2 flex justify-between font-sans text-[12px] text-ink-muted">
              <span>{classLabel ?? "Your class"} paid this year</span>
              <span>
                <b className="text-emerald-900">{paidCount}</b> / {memberCount}
              </span>
            </div>
            <div className="h-2 overflow-hidden bg-cream-dark">
              <div className="h-full bg-success" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}

        {error && <p className="mt-4 font-sans text-[12px] text-danger">{error}</p>}

        {done ? (
          <p className="mt-5 font-sans text-[14px] text-ink-soft">
            Thank you. Your {year} dues are settled.
          </p>
        ) : (
          <button
            onClick={pay}
            disabled={!configured || busy}
            className="btn btn-gold mt-6 justify-center py-3.5 disabled:opacity-50"
          >
            {!configured
              ? "Payment opens soon"
              : busy
                ? "Processing…"
                : `Pay ${ngn(amount)} for ${year} →`}
          </button>
        )}
      </div>
    </div>
  );
}
