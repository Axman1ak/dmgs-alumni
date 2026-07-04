"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signup, type AuthState } from "../actions";
import { AuthCard, FormNotice } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initial: AuthState = {};

export default function SignupPage() {
  const [state, action] = useFormState(signup, initial);

  return (
    <AuthCard
      title="Request membership"
      subtitle="Verified alumni of Doherty Memorial Grammar School"
    >
      {state.message ? (
        <FormNotice>{state.message}</FormNotice>
      ) : (
        <>
          <FormNotice>
            New accounts are reviewed by an administrator before access is
            granted. Fields marked * are required.
          </FormNotice>
          {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
          <form action={action}>
            {/* Identity + account */}
            <div className="grid grid-cols-2 gap-3">
              <Field name="first_name" label="First name *" autoComplete="given-name" required />
              <Field name="last_name" label="Last name *" autoComplete="family-name" required />
            </div>
            <Field name="email" label="Email address *" type="email" autoComplete="email" required />
            <Field name="password" label="Password *" type="password" autoComplete="new-password" minLength={8} required />

            {/* Directory details */}
            <Field name="occupation" label="Profession" autoComplete="organization-title" />
            <div className="mb-5">
              <label htmlFor="class_year" className="field-label">Graduating class *</label>
              <select id="class_year" name="class_year" required defaultValue="" className="field-input">
                <option value="" disabled>Select your year…</option>
                {Array.from({ length: 2020 - 1955 + 1 }, (_, i) => 2020 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field name="city" label="City" autoComplete="address-level2" />
              <Field name="country" label="Country *" autoComplete="country-name" required />
            </div>
            <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
            <div className="mb-5">
              <label htmlFor="bio" className="field-label">About you</label>
              <textarea id="bio" name="bio" rows={3} className="field-input" />
            </div>

            {/* Identity check */}
            <div className="mb-5 rounded-sm border border-border bg-paper p-4">
              <label htmlFor="verification_answer" className="field-label">
                Identity check *
              </label>
              <p className="mb-2 font-sans text-[12px] leading-relaxed text-ink-muted">
                To confirm you&rsquo;re a true old student: who was the senior prefect
                (head boy or head girl) in your final year at Doherty?
              </p>
              <input id="verification_answer" name="verification_answer" type="text" required className="field-input" />
            </div>

            <SubmitButton>Submit request</SubmitButton>
          </form>
        </>
      )}

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
  required,
  minLength,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
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
        required={required}
        minLength={minLength}
        className="field-input"
      />
    </div>
  );
}
