import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProfileEditForm } from "@/components/account/ProfileEditForm";
import { ClaimOrCreate } from "@/components/account/ClaimOrCreate";
import { createClient } from "@/lib/supabase/server";
import type { Alumni } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The caller's own listing, if they have one.
  const { data: mine } = await supabase
    .from("alumni")
    .select(
      "id, profile_id, full_name, class_year, occupation, city, state, country, phone, email, bio, photo_url, chapter, is_published",
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  const myName =
    (await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()).data?.full_name ?? "";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[760px] px-5 sm:px-8 py-14">
        <p className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-500">
          Your account
        </p>
        <h1 className="mb-8 mt-2 font-display text-[30px] sm:text-[42px] font-medium text-emerald-900">
          My profile
        </h1>

        {mine ? (
          <ProfileEditForm person={mine as Alumni} />
        ) : (
          <ClaimOrCreate defaultName={myName} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
