"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PRESETS = [5000, 10000, 25000, 50000];
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

export function GiveForm({
  me,
  userEmail,
  donorName,
  donorYear,
  donorClassLabel,
  projectId,
  projectTitle,
}: {
  me: string;
  userEmail: string;
  donorName: string;
  donorYear: number | null;
  donorClassLabel: string | null;
  projectId: string;
  projectTitle: string;
}) {
  const [amount, setAmount] = useState<number>(25000);
  const [custom, setCustom] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const effectiveAmount = custom ? Number(custom) : amount;
  const configured = Boolean(PUBLIC_KEY);

  async function give() {
    if (!configured) return;
    if (!effectiveAmount || effectiveAmount < 100) {
      setMessage("Please enter a valid amount.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const reference = `DMGS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Only amount, anonymity, currency and the reference are sent from the
    // browser. donor_profile_id, class_year, donor_name and status are pinned
    // server-side by the guard_donation_insert trigger (migration 0016) so a
    // gift cannot be forged, misattributed to another class, or self-marked
    // "success". The webhook alone promotes a donation to success.
    const { error } = await supabase.from("donations").insert({
      kind: "project",
      project_id: projectId,
      amount: effectiveAmount,
      currency: "NGN",
      is_anonymous: anonymous,
      paystack_reference: reference,
    });
    if (error) {
      setBusy(false);
      setStatus("error");
      setMessage(error.message);
      return;
    }

    try {
      await loadPaystack();
      const handler = window.PaystackPop.setup({
        key: PUBLIC_KEY,
        email: userEmail,
        amount: Math.round(effectiveAmount * 100), // kobo
        currency: "NGN",
        ref: reference,
        metadata: { class_year: donorYear, donor: me },
        callback: () => {
          setStatus("success");
          setMessage(`Your gift to ${projectTitle} was received and is being confirmed. A receipt is on its way to your email.`);
        },
        onClose: () => setBusy(false),
      });
      handler.openIframe();
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Payment failed to start.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "success") {
    return (
      <>
        <p className="m-toast">
          Thank you{donorName ? `, ${donorName.split(" ")[0]}` : ""}. {message}
        </p>
        <button type="button" className="m-btn m-btn-line m-btn-block" onClick={() => { setStatus("idle"); setMessage(null); }}>
          Give again
        </button>
      </>
    );
  }

  return (
    <div style={{ borderTop: "1px solid var(--m-line)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      {!configured && (
        <p style={{ fontSize: 14, color: "#4d5358", borderLeft: "3px solid var(--m-gold)", paddingLeft: 12 }}>
          Online giving opens as soon as the association&rsquo;s Paystack account is approved.
        </p>
      )}
      <b>Choose an amount</b>
      <div className="m-amts">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={!custom && amount === p}
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
          >
            ₦{p.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="m-field">
        <label htmlFor="custom" style={{ fontWeight: 500, color: "var(--m-muted)" }}>Or another amount (₦)</label>
        <input
          id="custom"
          className="m-input"
          type="number"
          inputMode="numeric"
          min={100}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. 15000"
        />
      </div>
      <label className="m-check">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Give anonymously (hide my name from other members)
      </label>
      <span style={{ fontSize: 13, color: "var(--m-muted)" }}>
        {donorClassLabel ? `Credited to ${donorClassLabel}.` : "Credited to your graduating class."}
      </span>
      {message && <p className="m-error">{message}</p>}
      <button
        type="button"
        onClick={give}
        disabled={!configured || busy}
        className="m-btn m-btn-gold m-btn-block"
        style={{ minHeight: 56 }}
      >
        {!configured ? "Giving opens soon" : busy ? "Processing…" : `Give ₦${(effectiveAmount || 0).toLocaleString()}`}
      </button>
      <span className="m-secure">Card or bank transfer in naira · secured by Paystack</span>
    </div>
  );
}
