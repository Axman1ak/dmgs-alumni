"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const full_name = clean(formData.get("full_name"));
  if (!full_name) return { error: "Name can't be empty." };

  const { error } = await supabase
    .from("alumni")
    .update({
      full_name,
      occupation: clean(formData.get("occupation")),
      city: clean(formData.get("city")),
      state: clean(formData.get("state")),
      country: clean(formData.get("country")),
      phone: clean(formData.get("phone")),
      email: clean(formData.get("email")),
      bio: clean(formData.get("bio")),
    })
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/directory");
  return { message: "Saved." };
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

  const { error } = await supabase.from("alumni").insert({
    profile_id: user.id,
    full_name,
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
