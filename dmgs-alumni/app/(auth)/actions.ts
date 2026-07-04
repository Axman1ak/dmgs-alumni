"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  // The middleware routes approved users to /directory and unapproved to /pending.
  redirect("/directory");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const occupation = String(formData.get("occupation") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const verificationAnswer = String(formData.get("verification_answer") ?? "").trim();

  if (!fullName || !email || !password || !country || !verificationAnswer) {
    return { error: "Please fill in every field, including the identity question." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        occupation,
        country,
        verification_answer: verificationAnswer,
      },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // If email confirmation is disabled, sign-up returns a live session — the
  // member is already signed in, so send them to the pending-approval page.
  // Otherwise, tell them to confirm their email first.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/pending");
  }

  return {
    message:
      "Request received. Confirm your email, then an administrator will review your membership before you can sign in.",
  };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/account/password`,
  });

  if (error) return { error: error.message };

  return {
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
