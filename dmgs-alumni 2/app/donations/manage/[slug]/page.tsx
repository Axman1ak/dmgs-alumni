import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProjectForm } from "@/components/donations/ProjectForm";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: { slug: string };
}) {
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

  const { data: row } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!row) notFound();
  const project = mapProject(row);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[820px] px-8 py-12">
        <Link href="/donations/manage" className="font-sans text-[13px] text-emerald-700 hover:underline">
          ← All projects
        </Link>
        <h1 className="mb-8 mt-2 font-display text-[40px] font-medium text-emerald-900">
          Edit project
        </h1>
        <ProjectForm project={project} />
      </main>
      <SiteFooter />
    </>
  );
}
