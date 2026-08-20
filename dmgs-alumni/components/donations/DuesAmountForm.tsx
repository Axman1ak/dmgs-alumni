"use client";

import { useFormState } from "react-dom";
import { setDuesAmount, type DuesState } from "@/app/donations/dues/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: DuesState = {};

/** Super-admin control to set the current year's dues amount. */
export function DuesAmountForm({ year, amount }: { year: number; amount: number | null }) {
  const [state, action] = useFormState(setDuesAmount, initial);

  return (
    <div className="border border-dashed border-emerald-700/40 bg-emerald-900/[0.03] p-5">
      <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
        Administrator · annual dues
      </p>
      <p className="mb-4 font-sans text-[13px] text-ink-muted">
        Set the amount every member pays for their class this year.
      </p>
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
      {state.message && <FormNotice>{state.message}</FormNotice>}
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="year" className="field-label">Year</label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={year}
            className="field-input w-[120px]"
          />
        </div>
        <div>
          <label htmlFor="amount" className="field-label">Amount (₦)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={1}
            defaultValue={amount ?? ""}
            placeholder="e.g. 5000"
            className="field-input w-[160px]"
          />
        </div>
        <SubmitButton>Save amount</SubmitButton>
      </form>
    </div>
  );
}
