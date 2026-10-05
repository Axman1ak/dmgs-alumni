import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DirectoryClient } from "@/components/directory/DirectoryClient";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/options";

export const dynamic = "force-dynamic";

/**
 * Directory. Reads the `directory_people` view, which hides each person's
 * email unless they chose to share it. Filtering happens in the browser:
 * a few hundred rows is small enough to search instantly.
 */
export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { class?: string; person?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: people }, { data: me }] = await Promise.all([
    supabase
      .from("directory_people")
      .select(
        "id, profile_id, full_name, first_name, last_name, maiden_name, former_name, class_year, country, state, industry, job_title, employer, interests, connect_pref, linkedin_url, social_url, photo_url, email, email_shared",
      )
      .order("last_name", { ascending: true, nullsFirst: false })
      .limit(5000),
    supabase.from("profiles").select("class_year").eq("id", user.id).single(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <DirectoryClient
          people={(people ?? []) as Person[]}
          me={user.id}
          myClass={me?.class_year ?? null}
          initialClass={searchParams.class ?? ""}
          initialPerson={searchParams.person ?? null}
          initialQuery={searchParams.q ?? ""}
        />
      </main>
      <SiteFooter />
    </>
  );
}
