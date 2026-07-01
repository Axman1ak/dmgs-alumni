"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { login, type AuthState } from "../actions";
import { AuthCard, FormNotice } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initial: AuthState = {};

export default function LoginPage() {
  const [state, action] = useFormState(login, initial);

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to the alumni community">
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
      <form action={action}>
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
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field-input" />
        </div>
        <SubmitButton>Sign in</SubmitButton>
      </form>

      <p className="mt-6 text-center font-sans text-[13px] text-ink-muted">
        <Link href="/reset-password" className="font-medium text-emerald-700 hover:underline">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-center font-sans text-[13px] text-ink-muted">
        New to the association?{" "}
        <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
          Request membership
        </Link>
      </p>
    </AuthCard>
  );
}
