import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProjectArt } from "@/components/donations/ProjectArt";
import { GiveForm } from "@/components/donations/GiveForm";
import { mapProject } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import { ngn } from "@/lib/format";

export const dynamic = "force-dynamic";

const COLORS = ["#0e3b2e", "#1f6a52", "#c9973f", "#8fb8a3", "#4d5358", "#d9b36a"];

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!row) notFound();
  const project = mapProject(row);

  // Who's giving, and to which class the gift is credited.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, class_year")
    .eq("id", user.id)
    .single();
  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;
  let myClassLabel: string | null = null;
  if (myYear) {
    const { data: cls } = await supabase
      .from("classes")
      .select("label")
      .eq("year", myYear)
      .maybeSingle();
    myClassLabel = cls?.label ?? null;
  }

  const [{ data: otherRows }, { data: totalsRows }] = await Promise.all([
    supabase.from("projects").select("*").neq("slug", params.slug).eq("is_published", true).order("sort_order"),
    supabase.rpc("project_totals"),
  ]);
  const others = (otherRows ?? []).map(mapProject);
  const raised = Number(
    (totalsRows ?? []).find((t: { project_id: string }) => t.project_id === project.id)?.total ?? 0,
  );
  const pct = project.goal > 0 ? Math.min(100, Math.round((raised / project.goal) * 100)) : 0;
  const budgetTotal = project.budget.reduce((s, b) => s + b.amount, 0) || project.goal || 1;
  const [lead, ...rest] = project.idea;

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <section className="m-phero">
          {project.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.photo} alt="" />
          ) : (
            <ProjectArt project={project} className="absolute inset-0 h-full w-full" />
          )}
          <div className="m-wrap">
            <Link href="/donations">← All projects</Link>
            <span className="m-eyebrow">{project.tag}</span>
            <h1>{project.title}</h1>
          </div>
        </section>

        <div className="m-wrap m-pbody">
          <article className="m-story">
            {(project.tagline || project.impact) && <p className="lead">{project.tagline ?? project.impact}</p>}
            {(lead || rest.length > 0) && (
              <div className="txt">
                {[lead, ...rest].filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}
            {project.budget.length > 0 && (
              <section className="m-stackcol" style={{ gap: 18 }}>
                <div className="m-rule-h">
                  <h2 style={{ fontSize: 26 }}>Where the {ngn(project.goal)} goes</h2>
                </div>
                <div className="m-stack">
                  {project.budget.map((b, i) => (
                    <span key={b.label} style={{ width: `${(b.amount / budgetTotal) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  ))}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="m-budget m-num">
                    <tbody>
                      {project.budget.map((b, i) => (
                        <tr key={b.label}>
                          <td style={{ width: 26 }}>
                            <span className="m-sw" style={{ background: COLORS[i % COLORS.length] }} />
                          </td>
                          <td>{b.label}</td>
                          <td className="r" style={{ color: "var(--m-muted)" }}>{Math.round((b.amount / budgetTotal) * 100)}%</td>
                          <td className="r" style={{ fontWeight: 700, width: 130 }}>{ngn(b.amount)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td />
                        <td>Total</td>
                        <td />
                        <td className="r">{ngn(budgetTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {others.length > 0 && (
              <section className="m-stackcol" style={{ gap: 18 }}>
                <div className="m-rule-h">
                  <h2 style={{ fontSize: 26 }}>Other open projects</h2>
                </div>
                <div className="m-more">
                  {others.map((p) => (
                    <Link key={p.slug} href={`/donations/projects/${p.slug}`}>
                      <div className="ph">
                        <ProjectArt project={p} className="h-full w-full" />
                      </div>
                      <span style={{ padding: "10px 14px 10px 0" }}>
                        <span className="m-eyebrow" style={{ display: "block", fontSize: 11 }}>{p.tag}</span>
                        <b>{p.title}</b>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="m-card m-givep" id="give" aria-label="Give to this project">
            <div className="m-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="m-row m-num" style={{ fontSize: 15 }}>
              <span>
                <strong>{ngn(raised)}</strong> raised
              </span>
              <span style={{ color: "var(--m-muted)" }}>of {ngn(project.goal)}</span>
            </div>
            <GiveForm
              me={user.id}
              userEmail={user.email ?? ""}
              donorName={profile?.full_name ?? ""}
              donorYear={myYear}
              donorClassLabel={myClassLabel}
              projectId={project.id}
              projectTitle={project.title}
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
