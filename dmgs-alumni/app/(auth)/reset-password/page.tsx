"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { requestPasswordReset, type AuthState } from "../actions";
import { AuthCard, FormNotice } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initial: AuthState = {};

export default function ResetPasswordPage() {
  const [state, action] = useFormState(requestPasswordReset, initial);

  return (
    <AuthCard
      title="Reset password"
      subtitle="We&rsquo;ll email you a secure link"
    >
      {state.message ? (
        <FormNotice>{state.message}</FormNotice>
      ) : (
        <>
          {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
          <form action={action}>
            <div className="mb-5">
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required className="field-input" />
            </div>
            <SubmitButton>Send reset link</SubmitButton>
          </form>
        </>
      )}

      <p className="mt-6 text-center font-sans text-[13px] text-ink-muted">
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
