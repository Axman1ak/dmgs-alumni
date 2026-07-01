"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PRESETS = [5000, 25000, 100000];
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
  donorYear,
  donorClassLabel,
}: {
  me: string;
  userEmail: string;
  donorYear: number | null;
  donorClassLabel: string | null;
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

    const { error } = await supabase.from("donations").insert({
      donor_profile_id: me,
      donor_name: anonymous ? "Anonymous" : null,
      class_year: donorYear,
      amount: effectiveAmount,
      currency: "NGN",
      is_anonymous: anonymous,
      paystack_reference: reference,
      status: "pending",
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
          setMessage("Thank you for your gift! Your payment is being confirmed.");
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
      <div className="border border-border bg-cream p-8 text-center">
        <h3 className="mb-2 font-display text-[28px] font-semibold text-emerald-900">
          Thank you
        </h3>
        <p className="text-[15px] text-ink-soft">{message}</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-cream p-8">
      <h3 className="mb-1 font-display text-[28px] font-semibold text-emerald-900">
        Make a gift
      </h3>
      <p className="mb-6 font-sans text-[13px] text-ink-muted">
        {donorClassLabel
          ? `Credited to ${donorClassLabel}.`
          : "Credited to your graduating class."}
      </p>

      {!configured && (
        <div className="mb-6 rounded-sm border-l-[3px] border-gold-500 bg-gold-500/10 px-4 py-3 text-[13px] text-ink-soft">
          Online giving opens as soon as the association&rsquo;s Paystack account
          is approved. The form is ready and waiting.
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
            className={`rounded-sm border px-3 py-3 font-sans text-[14px] transition-colors ${
              !custom && amount === p
                ? "border-emerald-700 bg-emerald-900 text-cream"
                : "border-border bg-paper text-ink-soft hover:border-emerald-700"
            }`}
          >
            ₦{p.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <label className="field-label" htmlFor="custom">Or a custom amount (₦)</label>
        <input
          id="custom"
          type="number"
          min={100}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. 50000"
          className="field-input"
        />
      </div>

      <label className="mb-6 flex items-center gap-2.5 font-sans text-[13px] text-ink-soft">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        Give anonymously
      </label>

      {message && status === "error" && (
        <p className="mb-4 font-sans text-[12px] text-danger">{message}</p>
      )}

      <button
        onClick={give}
        disabled={!configured || busy}
        className="btn btn-gold w-full justify-center py-3.5 disabled:opacity-50"
      >
        {!configured
          ? "Giving opens soon"
          : busy
            ? "Processing…"
            : `Give ₦${(effectiveAmount || 0).toLocaleString()}`}
      </button>
    </div>
  );
}
