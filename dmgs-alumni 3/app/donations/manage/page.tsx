import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";
import { ngn } from "@/lib/format";
import { deleteProject } from "./actions";

export const dynamic = "force-dynamic";

export default async function ManageProjectsPage() {
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

  const { data: rows } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order");
  const projects = (rows ?? []).map(mapProject);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/donations" className="font-sans text-[13px] text-emerald-700 hover:underline">
              ← Back to giving
            </Link>
            <h1 className="mt-2 font-display text-[40px] font-medium text-emerald-900">
              Manage projects
            </h1>
          </div>
          <Link href="/donations/manage/new" className="btn btn-gold">
            + New project
          </Link>
        </div>

        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border border-border bg-cream px-6 py-4"
            >
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-gold-500">
                  {p.tag}
                </p>
                <p className="font-display text-[22px] font-semibold text-emerald-900">
                  {p.title}
                </p>
                <p className="font-sans text-[12px] text-ink-muted">Goal {ngn(p.goal)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/donations/projects/${p.slug}`} className="btn btn-outline px-4 py-2 text-[12px]">
                  View
                </Link>
                <Link href={`/donations/manage/${p.slug}`} className="btn btn-primary px-4 py-2 text-[12px]">
                  Edit
                </Link>
                <form action={deleteProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="btn btn-danger px-4 py-2 text-[12px]">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="border border-border bg-cream px-4 py-10 text-center font-sans text-[14px] text-ink-muted">
              No projects yet. Create your first with &ldquo;New project&rdquo;.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
