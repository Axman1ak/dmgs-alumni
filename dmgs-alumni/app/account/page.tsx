import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProfileEditForm, type MyListing } from "@/components/account/ProfileEditForm";
import { ClaimOrCreate } from "@/components/account/ClaimOrCreate";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: mine }, { data: profile }] = await Promise.all([
    supabase
      .from("alumni")
      .select(
        "id, profile_id, full_name, first_name, last_name, maiden_name, former_name, class_year, country, state, industry, job_title, employer, interests, connect_pref, linkedin_url, social_url, email, email_shared, photo_url",
      )
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, approved_at, created_at").eq("id", user.id).single(),
  ]);

  const since = new Date(profile?.approved_at ?? profile?.created_at ?? Date.now()).getFullYear();

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        {mine ? (
          <ProfileEditForm person={mine as MyListing} memberSince={since} />
        ) : (
          <div className="m-wrap m-body" style={{ maxWidth: 760 }}>
            <h1 style={{ fontSize: 36, color: "var(--m-emerald)", marginBottom: 24 }}>My profile</h1>
            <ClaimOrCreate defaultName={profile?.full_name ?? ""} />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
