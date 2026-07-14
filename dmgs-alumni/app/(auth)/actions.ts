"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error?: string; message?: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SignupDetails = {
  fullName: string;
  email: string;
  classYear: string;
  occupation: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  verificationAnswer: string;
};

/**
 * Tell the people who can approve this person that they're waiting: every
 * super admin, plus the class admin for the applicant's graduating year.
 *
 * Uses the service-role client because the applicant themselves has no
 * permission to read other members' profiles. Never throws — a mail failure
 * must not break a signup.
 */
async function notifyAdminsOfSignup(d: SignupDetails): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Not configured yet — silently skip.

  try {
    const admin = createAdminClient();
    const year = Number(d.classYear);

    const query = admin.from("profiles").select("email");
    const { data: recipientsRaw } = Number.isInteger(year)
      ? await query.or(
          `role.eq.super_admin,and(role.eq.class_admin,admin_of_year.eq.${year})`,
        )
      : await query.eq("role", "super_admin");

    const to = Array.from(
      new Set(
        (recipientsRaw ?? [])
          .map((r: { email: string | null }) => r.email)
          .filter((e): e is string => Boolean(e)),
      ),
    );
    if (to.length === 0) return;

    const row = (label: string, value: string) =>
      value
        ? `<tr><td style="padding:6px 16px 6px 0;color:#6b6b63;font-size:13px;">${label}</td><td style="padding:6px 0;color:#1c1c1a;font-size:14px;">${esc(value)}</td></tr>`
        : "";

    const html = `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;">
        <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b8912f;margin:0 0 8px;">
          DMGS Old Students Association
        </p>
        <h1 style="font-size:24px;color:#0f3d2e;margin:0 0 16px;">A new member is waiting for approval</h1>
        <p style="font-size:15px;line-height:1.6;color:#3f3f3a;margin:0 0 20px;">
          <strong>${esc(d.fullName)}</strong> has requested membership. Review their details and
          the identity answer below, then approve or reject them in the admin panel.
        </p>
        <table style="border-collapse:collapse;margin:0 0 24px;">
          ${row("Name", d.fullName)}
          ${row("Email", d.email)}
          ${row("Class year", d.classYear)}
          ${row("Profession", d.occupation)}
          ${row("City", d.city)}
          ${row("State", d.state)}
          ${row("Country", d.country)}
          ${row("Phone", d.phone)}
        </table>
        <div style="border-left:3px solid #d8b25a;padding:10px 0 10px 14px;margin:0 0 24px;">
          <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b63;margin:0 0 6px;">
            Identity check &mdash; senior prefect in their final year
          </p>
          <p style="font-size:15px;color:#1c1c1a;margin:0;">${esc(d.verificationAnswer) || "&mdash;"}</p>
        </div>
        <a href="${siteUrl()}/admin"
           style="display:inline-block;background:#0f3d2e;color:#f7f2e6;text-decoration:none;padding:12px 24px;font-family:Arial,sans-serif;font-size:14px;">
          Review in the admin panel
        </a>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DMGS Old Students Association <noreply@dmgsosaconnect.org>",
        to,
        subject: `Membership request: ${d.fullName}${
          Number.isInteger(year) ? ` (Class of ${year})` : ""
        }`,
        html,
      }),
    });
  } catch {
    // Never let a notification failure break a signup.
  }
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
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const occupation = String(formData.get("occupation") ?? "").trim();
  const classYear = String(formData.get("class_year") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const verificationAnswer = String(formData.get("verification_answer") ?? "").trim();

  if (!firstName || !lastName || !email || !password || !country || !classYear || !verificationAnswer) {
    return { error: "Please fill in your name, email, country, class year, and the identity question." };
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
        class_year: classYear,
        city,
        state,
        country,
        phone,
        bio,
        verification_answer: verificationAnswer,
      },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // Tell the approvers someone is waiting (super admins + this class's admin).
  await notifyAdminsOfSignup({
    fullName,
    email,
    classYear,
    occupation,
    city,
    state,
    country,
    phone,
    verificationAnswer,
  });

  // If email confirmation is disabled, sign-up returns a live session - the
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
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password/update`,
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
