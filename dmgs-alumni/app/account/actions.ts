"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { INDUSTRIES, safeUrl, uniqueInterests } from "@/lib/options";

export type FormState = { error?: string; message?: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function clean(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** Update the caller's own listing. class_year is pinned by the DB guard. */
export async function updateMyProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const first_name = clean(formData.get("first_name"));
  const last_name = clean(formData.get("last_name"));
  if (!first_name || !last_name) return { error: "First name and surname are required." };

  const industryRaw = clean(formData.get("industry"));
  const industry = industryRaw && (INDUSTRIES as readonly string[]).includes(industryRaw) ? industryRaw : null;
  // Suggested chips plus the member's own (e.g. "Hiking", "Gaming").
  const interests = uniqueInterests(formData.getAll("interests").map((v) => String(v)));
  const connectRaw = clean(formData.get("connect_pref"));
  const connect_pref = connectRaw && ["mentor", "network", "none"].includes(connectRaw) ? connectRaw : null;

  const linkedinRaw = clean(formData.get("linkedin_url"));
  const socialRaw = clean(formData.get("social_url"));
  if (linkedinRaw && !safeUrl(linkedinRaw)) return { error: "That LinkedIn link doesn't look right. Paste the address of your profile page." };
  if (socialRaw && !safeUrl(socialRaw)) return { error: "That social link doesn't look right. Paste the full address." };

  const email = clean(formData.get("email"));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn't look right." };

  const full_name = `${first_name} ${last_name}`;

  const { error } = await supabase
    .from("alumni")
    .update({
      full_name,
      first_name,
      last_name,
      maiden_name: clean(formData.get("maiden_name")),
      former_name: clean(formData.get("former_name")),
      country: clean(formData.get("country")),
      state: clean(formData.get("state")),
      industry,
      job_title: clean(formData.get("job_title")),
      employer: clean(formData.get("employer")),
      interests,
      connect_pref,
      linkedin_url: linkedinRaw,
      social_url: socialRaw,
      email,
      email_shared: formData.get("email_shared") === "on" && Boolean(email),
    })
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  // Keep the account name in step with the directory listing.
  await supabase.from("profiles").update({ full_name, first_name, last_name, maiden_name: clean(formData.get("maiden_name")) }).eq("id", user.id);

  revalidatePath("/account");
  revalidatePath("/directory");
  revalidatePath("/home");
  return { message: "Your profile has been saved." };
}

/** Create a fresh listing owned by the caller. */
export async function createMyListing(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const full_name = clean(formData.get("full_name"));
  if (!full_name) return { error: "Please enter your name." };

  const yearRaw = clean(formData.get("class_year"));
  const class_year = yearRaw ? Number(yearRaw) : null;

  const parts = full_name.split(/\s+/);
  const { error } = await supabase.from("alumni").insert({
    profile_id: user.id,
    full_name,
    first_name: parts.length > 1 ? parts.slice(0, -1).join(" ") : full_name,
    last_name: parts.length > 1 ? parts[parts.length - 1] : null,
    class_year,
    occupation: clean(formData.get("occupation")),
    city: clean(formData.get("city")),
    state: clean(formData.get("state")),
    country: clean(formData.get("country")),
    phone: clean(formData.get("phone")),
    email: clean(formData.get("email")),
    bio: clean(formData.get("bio")),
    chapter: "Self-registered",
  });

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/directory");
  return { message: "Listing created." };
}

/** Persist a new photo URL after the client uploads to Storage. */
export async function savePhotoUrl(url: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("alumni")
    .update({ photo_url: url })
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/directory");
  return { message: "Photo updated." };
}
