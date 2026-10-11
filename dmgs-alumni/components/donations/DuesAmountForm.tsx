"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setDuesAmount, type DuesState } from "@/app/donations/dues/actions";

const initial: DuesState = {};

/** Super-admin control to set the current year's dues amount. */
export function DuesAmountForm({ year, amount }: { year: number; amount: number | null }) {
  const [state, action] = useFormState(setDuesAmount, initial);

  return (
    <form action={action} className="m-card" style={{ padding: "20px 22px", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 220px" }}>
        <b style={{ display: "block" }}>Annual dues</b>
        <span style={{ fontSize: 13, color: "var(--m-muted)" }}>The amount every member pays for their class.</span>
      </div>
      <div className="m-field">
        <label htmlFor="dues-year">Year</label>
        <input id="dues-year" name="year" type="number" defaultValue={year} className="m-input" style={{ width: 110 }} />
      </div>
      <div className="m-field">
        <label htmlFor="dues-amount">Amount (₦)</label>
        <input id="dues-amount" name="amount" type="number" min={1} defaultValue={amount ?? ""} placeholder="e.g. 5000" className="m-input" style={{ width: 150 }} />
      </div>
      <SaveButton />
      {state.error && <p className="m-error" style={{ flexBasis: "100%" }}>{state.error}</p>}
      {state.message && <p className="m-toast" style={{ flexBasis: "100%" }}>{state.message}</p>}
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="m-btn m-btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save amount"}
    </button>
  );
}
