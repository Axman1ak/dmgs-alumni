import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProjectForm } from "@/components/donations/ProjectForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/donations");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[820px] px-8 py-12">
        <Link href="/donations/manage" className="font-sans text-[13px] text-emerald-700 hover:underline">
          ← All projects
        </Link>
        <h1 className="mb-8 mt-2 font-display text-[40px] font-medium text-emerald-900">
          New project
        </h1>
        <ProjectForm />
      </main>
      <SiteFooter />
    </>
  );
}
