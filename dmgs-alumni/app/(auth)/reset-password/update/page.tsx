"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, FormNotice } from "@/components/auth/AuthCard";

/**
 * Landing page for the password-reset email link. By the time the user reaches
 * here, /auth/callback has already exchanged the one-time code for a session,
 * so we can call updateUser({ password }) directly.
 */
export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Set a new password for your account"
    >
      {done ? (
        <>
          <FormNotice>Your password has been updated.</FormNotice>
          <p className="mt-6 text-center font-sans text-[13px] text-ink-muted">
            <Link href="/directory" className="font-medium text-emerald-700 hover:underline">
              Continue to the site
            </Link>
          </p>
        </>
      ) : (
        <form onSubmit={onSubmit}>
          {error && <FormNotice tone="error">{error}</FormNotice>}
          <div className="mb-5">
            <label htmlFor="password" className="field-label">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="confirm" className="field-label">
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="field-input"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full justify-center py-3.5 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
