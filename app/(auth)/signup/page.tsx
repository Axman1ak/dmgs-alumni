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
            granted. You&rsquo;ll confirm your email first.
          </FormNotice>
          {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
          <form action={action}>
            <div className="mb-5">
              <label htmlFor="full_name" className="field-label">
                Full name
              </label>
              <input id="full_name" name="full_name" type="text" autoComplete="name" required className="field-input" />
            </div>
            <div className="mb-5">
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required className="field-input" />
            </div>
            <div className="mb-5">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field-input" />
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
