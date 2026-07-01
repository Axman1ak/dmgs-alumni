"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import type { Alumni } from "@/lib/types";
import { classBadge } from "@/lib/types";
import { claimListing, createMyListing, type FormState } from "@/app/account/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: FormState = {};

export function ClaimOrCreate({
  unclaimed,
  defaultName,
}: {
  unclaimed: Alumni[];
  defaultName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"find" | "create">("find");
  const [query, setQuery] = useState(defaultName ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [claimState, claimAction] = useFormState(claimListing, initial);
  const [createState, createAction] = useFormState(createMyListing, initial);

  // When a claim/create succeeds, refresh so the server renders the edit form.
  useEffect(() => {
    if (claimState.message || createState.message) router.refresh();
  }, [claimState.message, createState.message, router]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unclaimed.slice(0, 20);
    return unclaimed
      .filter((a) => a.full_name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [unclaimed, query]);

  return (
    <div>
      <p className="mb-6 text-[16px] leading-relaxed text-ink-soft">
        You don&rsquo;t have a directory listing yet. Find your existing entry to
        claim it, or create a new one.
      </p>

      {/* Mode toggle */}
      <div className="mb-8 flex gap-1 border-b border-border">
        {(["find", "create"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative px-5 py-3 font-sans text-[13px] uppercase tracking-[0.06em] transition-colors ${
              mode === m ? "text-emerald-900" : "text-ink-muted hover:text-ink"
            }`}
          >
            {m === "find" ? "Find my listing" : "Create new"}
            {mode === m && (
              <span className="absolute inset-x-5 bottom-[-1px] h-0.5 bg-gold-500" />
            )}
          </button>
        ))}
      </div>

      {mode === "find" ? (
        <div>
          {claimState.error && (
            <FormNotice tone="error">{claimState.error}</FormNotice>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by your name…"
            className="field-input mb-4"
          />

          {matches.length === 0 ? (
            <p className="py-8 text-center font-sans text-[14px] text-ink-muted">
              No unclaimed listings match that name. Try the &ldquo;Create
              new&rdquo; tab.
            </p>
          ) : (
            <div className="mb-6 overflow-hidden rounded-[2px] border border-border">
              {matches.map((a) => {
                const badge = classBadge(a.class_year);
                const isSel = selectedId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`flex w-full items-center justify-between border-b border-border px-5 py-3.5 text-left transition-colors last:border-b-0 ${
                      isSel ? "bg-emerald-900/5" : "hover:bg-cream-dark"
                    }`}
                  >
                    <span>
                      <span className="block font-display text-[18px] font-semibold text-emerald-900">
                        {a.full_name}
                      </span>
                      <span className="font-sans text-[12px] text-ink-muted">
                        {badge ? `Class of ${badge}` : "Year not provided"}
                        {a.city ? ` · ${a.city}` : ""}
                      </span>
                    </span>
                    {isSel && (
                      <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-gold-500">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedId && (
            <form action={claimAction}>
              <input type="hidden" name="alumni_id" value={selectedId} />
              <SubmitButton>This is me — claim listing</SubmitButton>
            </form>
          )}
        </div>
      ) : (
        <form action={createAction}>
          {createState.error && (
            <FormNotice tone="error">{createState.error}</FormNotice>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="full_name" label="Full name" defaultValue={defaultName} required />
            <Field name="class_year" label="Class year (e.g. 1977)" type="number" />
            <Field name="occupation" label="Occupation" />
            <Field name="city" label="City" />
            <Field name="country" label="Country" />
            <Field name="phone" label="Phone" />
            <Field name="email" label="Email" type="email" />
          </div>
          <div className="mt-5">
            <label className="field-label" htmlFor="bio">About</label>
            <textarea id="bio" name="bio" rows={3} className="field-input" />
          </div>
          <div className="mt-6">
            <SubmitButton>Create my listing</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="field-input"
      />
    </div>
  );
}
