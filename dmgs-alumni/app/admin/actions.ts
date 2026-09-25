"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminState = { error?: string; message?: string };

async function requireSuperAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") throw new Error("Not authorized.");
  return { supabase, user };
}

function id(formData: FormData) {
  return String(formData.get("id") ?? "");
}

export async function approveMember(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();
  const memberId = id(formData);

  await supabase
    .from("profiles")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user.id })
    .eq("id", memberId);

  // Put the new member in the directory, using the details they gave at
  // sign-up. They can enrich it (bio, photo) from their profile page.
  const { data: existing } = await supabase
    .from("alumni")
    .select("id")
    .eq("profile_id", memberId)
    .maybeSingle();

  if (!existing) {
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name, occupation, city, state, country, phone, bio, class_year")
      .eq("id", memberId)
      .single();

    // If the admin matched this person to an imported register listing, link
    // that listing to them instead of creating a second one. Only unclaimed
    // listings can be linked (the .is() guard), so nobody can take over a
    // listing that already belongs to another member.
    const linkId = String(formData.get("link_alumni_id") ?? "");
    let linked = false;
    if (p && linkId && linkId !== "new") {
      const { data: updated } = await supabase
        .from("alumni")
        .update({
          profile_id: memberId,
          full_name: p.full_name,
          ...(p.class_year ? { class_year: p.class_year } : {}),
          ...(p.occupation ? { occupation: p.occupation } : {}),
          ...(p.city ? { city: p.city } : {}),
          ...(p.state ? { state: p.state } : {}),
          ...(p.country ? { country: p.country } : {}),
          ...(p.phone ? { phone: p.phone } : {}),
          ...(p.bio ? { bio: p.bio } : {}),
          is_published: true,
        })
        .eq("id", linkId)
        .is("profile_id", null)
        .select("id");
      linked = (updated?.length ?? 0) > 0;
    }

    if (p && !linked) {
      await supabase.from("alumni").insert({
        profile_id: memberId,
        full_name: p.full_name,
        occupation: p.occupation,
        city: p.city,
        state: p.state,
        country: p.country,
        phone: p.phone,
        bio: p.bio,
        class_year: p.class_year,
        chapter: "Member",
        is_published: true,
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/directory");
}

export async function rejectMember(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  await supabase.from("profiles").update({ status: "rejected" }).eq("id", id(formData));
  revalidatePath("/admin");
}

/**
 * Permanently delete a member: their directory listing, their profile, and the
 * login itself. Needs the service-role client because removing an auth user is
 * an admin-only operation.
 *
 * Donation records are deliberately NOT deleted — donations.donor_profile_id is
 * ON DELETE SET NULL and donor_name is a stored snapshot, so the financial
 * history stays intact and the class totals don't silently change.
 */
export async function deleteMember(formData: FormData) {
  const { user } = await requireSuperAdmin();
  const memberId = id(formData);

  if (!memberId) throw new Error("No member specified.");
  if (memberId === user.id) throw new Error("You can't delete your own account.");

  const admin = createAdminClient();

  // Directory listing first (profile_id would otherwise be nulled and orphaned).
  // Listings imported from the OSA register go back to being unclaimed
  // register entries (personal details wiped) so the register stays complete.
  await admin
    .from("alumni")
    .update({
      profile_id: null,
      occupation: null,
      city: null,
      state: null,
      country: null,
      phone: null,
      email: null,
      bio: null,
      photo_url: null,
    })
    .eq("profile_id", memberId)
    .neq("source", "member");
  await admin.from("alumni").delete().eq("profile_id", memberId);

  // Deleting the auth user cascades to profiles.
  const { error } = await admin.auth.admin.deleteUser(memberId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/directory");
}

/** Assign a role. Class admins get a graduating year; wired to classes.admin_id. */
export async function setMemberRole(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const { supabase } = await requireSuperAdmin();
  const memberId = id(formData);
  const role = String(formData.get("role") ?? "member");
  const adminYearRaw = String(formData.get("admin_year") ?? "").trim();
  const classYearRaw = String(formData.get("class_year") ?? "").trim();
  const adminYear = adminYearRaw ? Number(adminYearRaw) : null;
  const classYear = classYearRaw ? Number(classYearRaw) : null;

  if (role === "class_admin" && !adminYear) {
    return { error: "A class admin needs a graduating year." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      class_year: classYear,
      admin_of_year: role === "class_admin" ? adminYear : null,
    })
    .eq("id", memberId);
  if (error) return { error: error.message };

  // Keep classes.admin_id in sync.
  await supabase.from("classes").update({ admin_id: null }).eq("admin_id", memberId);
  if (role === "class_admin" && adminYear) {
    await supabase.from("classes").update({ admin_id: memberId }).eq("year", adminYear);
  }

  revalidatePath("/admin");
  return { message: "Saved." };
}
