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
      <div className="m-card" style={{ padding: 28 }}>
        <span className="m-eyebrow">Annual dues · {year}</span>
        <p style={{ marginTop: 8, color: "#4d5358" }}>
          The {year} dues amount has not been set yet. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <section className="m-card m-dues" id="dues">
      <div>
        <span className="m-eyebrow">Annual dues · {year}</span>
        <span className="m-big m-num">{ngn(amount)}</span>
        <span className="m-pill" style={{ color: done ? "#1f6a52" : "#9a4a17" }}>
          <span className="m-dot" />
          {done ? `Paid for ${year}` : "Not paid yet"}
        </span>
      </div>
      <div>
        <b>{classLabel ?? "Your class"} participation</b>
        <div className="m-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
          {paidCount} of {memberCount} {memberCount === 1 ? "member" : "members"} from your class{" "}
          {paidCount === 1 ? "has" : "have"} paid this year.
        </span>
      </div>
      <div>
        {error && <p className="m-error">{error}</p>}
        {done ? (
          <p className="m-toast">Thank you. Your {year} dues are settled.</p>
        ) : (
          <>
            <button type="button" onClick={pay} disabled={!configured || busy} className="m-btn m-btn-gold m-btn-block">
              {!configured ? "Payment opens soon" : busy ? "Processing…" : `Pay ${ngn(amount)} dues`}
            </button>
            <span className="m-secure">Card or bank transfer · secured by Paystack</span>
          </>
        )}
      </div>
    </section>
  );
}
