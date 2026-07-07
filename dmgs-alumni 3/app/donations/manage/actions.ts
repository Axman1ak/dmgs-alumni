"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseBudget, parseIdea, slugify } from "@/lib/projects";

export type ProjectState = { error?: string };

function clean(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

/** Create or update a project (RLS restricts writes to super admins). */
export async function saveProject(
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const supabase = createClient();

  const id = clean(formData.get("id"));
  const title = clean(formData.get("title"));
  const tag = clean(formData.get("tag"));
  if (!title || !tag) return { error: "Title and tag are required." };

  const slug = clean(formData.get("slug")) || slugify(title);
  const payload = {
    slug,
    tag,
    title,
    tagline: clean(formData.get("tagline")) || null,
    idea: parseIdea(clean(formData.get("idea"))),
    budget: parseBudget(clean(formData.get("budget"))),
    art: clean(formData.get("art")) || "library",
    photo_url: clean(formData.get("photo_url")) || null,
    goal: Number(clean(formData.get("goal")).replace(/[^0-9.]/g, "")) || 0,
    impact: clean(formData.get("impact")) || null,
    sort_order: Number(clean(formData.get("sort_order"))) || 0,
    is_published: formData.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("projects").update(payload).eq("id", id)
    : await supabase.from("projects").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/donations");
  revalidatePath("/donations/manage");
  redirect("/donations/manage");
}

export async function deleteProject(formData: FormData) {
  const supabase = createClient();
  const id = clean(formData.get("id"));
  if (id) {
    await supabase.from("projects").delete().eq("id", id);
    revalidatePath("/donations");
    revalidatePath("/donations/manage");
  }
  redirect("/donations/manage");
}
