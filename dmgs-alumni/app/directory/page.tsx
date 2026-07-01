import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DirectoryClient } from "@/components/directory/DirectoryClient";
import { createClient } from "@/lib/supabase/server";
import type { Alumni } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const supabase = createClient();

  const { data: alumni } = await supabase
    .from("alumni")
    .select(
      "id, profile_id, full_name, class_year, occupation, city, country, phone, email, bio, photo_url, chapter, is_published",
    )
    .order("full_name");

  const rows = (alumni ?? []) as Alumni[];

  // Distinct countries + years for the filter dropdowns.
  const countries = Array.from(
    new Set(rows.map((a) => a.country).filter(Boolean) as string[]),
  ).sort();
  const years = Array.from(
    new Set(rows.map((a) => a.class_year).filter(Boolean) as number[]),
  ).sort((a, b) => b - a);

  return (
    <>
      <SiteHeader />
      <main>
        <DirectoryClient alumni={rows} countries={countries} years={years} />
      </main>
      <SiteFooter />
    </>
  );
}
