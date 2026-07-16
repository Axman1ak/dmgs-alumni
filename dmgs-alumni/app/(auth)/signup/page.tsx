"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { signup, type AuthState } from "../actions";
import { AuthCard, FormNotice } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initial: AuthState = {};

const CURRENT_YEAR = new Date().getFullYear();
const CLASS_YEARS = Array.from(
  { length: CURRENT_YEAR - 1955 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

const STEPS = [
  { n: 1, label: "Your account" },
  { n: 2, label: "Your details" },
  { n: 3, label: "Identity check" },
];

/**
 * Three-step sign-up. All fields live in one <form> the whole time — the steps
 * only show/hide sections — so a single submit sends everything and nothing is
 * lost if the user steps backwards.
 */
export default function SignupPage() {
  const [state, action] = useFormState(signup, initial);
  const [step, setStep] = useState(1);

  // Step 1 fields, tracked so we can validate before letting the user advance.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classYear, setClassYear] = useState("");
  const [country, setCountry] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function next() {
    setLocalError(null);
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
        setLocalError("Please fill in your name, email, and a password.");
        return;
      }
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters.");
        return;
      }
    }
    if (step === 2) {
      if (!classYear || !country.trim()) {
        setLocalError("Please give your graduating class and your country.");
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  }

  if (state.message) {
    return (
      <AuthCard title="Request received" subtitle="An administrator will review it">
        <FormNotice>{state.message}</FormNotice>
        <p className="mt-6 text-center font-sans text-[13px] text-ink-muted">
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Request membership"
      subtitle="Verified old students of Doherty Memorial Grammar School"
    >
      {/* Progress */}
      <div className="mb-7 flex items-center gap-2">
        {STEPS.map((s) => (
          <div key={s.n} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                step >= s.n ? "bg-gold-500" : "bg-border"
              }`}
            />
            <p
              className={`mt-2 font-sans text-[10px] uppercase tracking-[0.12em] ${
                step === s.n ? "text-emerald-900" : "text-ink-muted"
              }`}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
      {localError && <FormNotice tone="error">{localError}</FormNotice>}

      <form action={action}>
        {/* ---------------- Step 1 — account ---------------- */}
        <div className={step === 1 ? "block" : "hidden"}>
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            <Field
              name="first_name"
              label="First name *"
              autoComplete="given-name"
              value={firstName}
              onChange={setFirstName}
            />
            <Field
              name="last_name"
              label="Last name *"
              autoComplete="family-name"
              value={lastName}
              onChange={setLastName}
            />
          </div>
          <Field
            name="email"
            label="Email address *"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            name="password"
            label="Password *"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            hint="At least 8 characters."
          />
        </div>

        {/* ---------------- Step 2 — directory details ---------------- */}
        <div className={step === 2 ? "block" : "hidden"}>
          <div className="mb-5">
            <label htmlFor="class_year" className="field-label">
              Graduating class *
            </label>
            <select
              id="class_year"
              name="class_year"
              value={classYear}
              onChange={(e) => setClassYear(e.target.value)}
              className="field-input"
            >
              <option value="" disabled>
                Select your year…
              </option>
              {CLASS_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Field name="occupation" label="Profession" autoComplete="organization-title" />

          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            <Field name="city" label="City" autoComplete="address-level2" />
            <Field name="state" label="State / Province" autoComplete="address-level1" />
          </div>
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            <Field
              name="country"
              label="Country *"
              autoComplete="country-name"
              value={country}
              onChange={setCountry}
            />
            <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
          </div>

          <div className="mb-5">
            <label htmlFor="bio" className="field-label">
              About you
            </label>
            <textarea id="bio" name="bio" rows={3} className="field-input" />
          </div>
        </div>

        {/* ---------------- Step 3 — identity check ---------------- */}
        <div className={step === 3 ? "block" : "hidden"}>
          <div className="mb-5 border-l-[3px] border-gold-500 bg-gold-500/10 px-4 py-3.5">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900">
              Security question
            </p>
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-ink-soft">
              The directory holds the personal details of old students, so we only
              admit people we can verify. An administrator reads your answer below
              before approving your account. Answer as accurately as you can.
            </p>
          </div>

          <div className="mb-5">
            <label htmlFor="verification_answer" className="field-label">
              Who was the senior prefect (head boy or head girl) in your final year
              at Doherty? *
            </label>
            <input
              id="verification_answer"
              name="verification_answer"
              type="text"
              required
              className="field-input"
            />
          </div>
        </div>

        {/* ---------------- Navigation ---------------- */}
        <div className="mt-2 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                setStep((s) => s - 1);
              }}
              className="btn btn-outline"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={next} className="btn btn-primary flex-1 justify-center">
              Continue
            </button>
          ) : (
            <div className="flex-1">
              <SubmitButton>Submit request</SubmitButton>
            </div>
          )}
        </div>
      </form>

      <p className="mt-6 text-center font-sans text-[13px] text-ink-muted">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (v: string) => void;
  hint?: string;
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <div className="mb-5">
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        className="field-input"
        {...(controlled
          ? { value, onChange: (e) => onChange(e.target.value) }
          : {})}
      />
      {hint && <p className="mt-1.5 font-sans text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}
