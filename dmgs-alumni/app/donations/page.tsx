import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DuesCard } from "@/components/donations/DuesCard";
import { ProjectArt } from "@/components/donations/ProjectArt";
import { createClient } from "@/lib/supabase/server";
import { mapProject, type Project } from "@/lib/projects";
import { ngn, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Completed works (the school's "Then & Now" photos). Same list as the
// public landing page; confirm with the association which ones it funded.
const DONE = [
  { title: "Classroom block", img: "/img/class-after.jpg" },
  { title: "Borehole & water tower", img: "/img/water-after.jpg" },
  { title: "Principal's house", img: "/img/house-after.jpg" },
];

const COLORS = ["#0e3b2e", "#1f6a52", "#c9973f", "#8fb8a3", "#4d5358", "#d9b36a"];

function millions(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return ngn(n);
}

function BudgetStack({ p }: { p: Project }) {
  const total = p.budget.reduce((s, b) => s + b.amount, 0) || 1;
  return (
    <div className="m-stack" aria-label="Budget breakdown">
      {p.budget.map((b, i) => (
        <span
          key={b.label}
          title={`${b.label}: ${ngn(b.amount)}`}
          style={{ width: `${(b.amount / total) * 100}%`, background: COLORS[i % COLORS.length] }}
        />
      ))}
    </div>
  );
}

export default async function DonationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = new Date().getFullYear();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, class_year, full_name")
    .eq("id", user.id)
    .single();
  const isSuper = profile?.role === "super_admin";
  const isClassAdmin = profile?.role === "class_admin";

  // My graduating class + label.
  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;
  let classLabel: string | null = null;
  if (myYear) {
    const { data: cls } = await supabase.from("classes").select("label").eq("year", myYear).maybeSingle();
    classLabel = cls?.label ?? `Class of ${myYear}`;
  }

  // Projects + money raised per project.
  const [{ data: projRows }, { data: totalsRows }] = await Promise.all([
    supabase.from("projects").select("*").order("sort_order"),
    supabase.rpc("project_totals"),
  ]);
  const projects = (projRows ?? []).filter((p) => p.is_published || isSuper).map(mapProject);
  const totalById = new Map<string, number>(
    (totalsRows ?? []).map((t: { project_id: string; total: number | string }) => [t.project_id, Number(t.total)]),
  );
  const needed = projects.reduce((s, p) => s + Math.max(0, p.goal - (totalById.get(p.id) ?? 0)), 0);

  // Dues: amount, whether I've paid this year, class participation.
  const [{ data: duesRow }, { data: myDues }, { data: part }] = await Promise.all([
    supabase.from("annual_dues").select("amount").eq("year", year).maybeSingle(),
    supabase
      .from("donations")
      .select("id")
      .eq("kind", "dues")
      .eq("donor_profile_id", user.id)
      .eq("period_year", year)
      .eq("status", "success")
      .maybeSingle(),
    supabase.rpc("class_dues_participation", { p_year: year }),
  ]);
  const duesAmount = duesRow ? Number(duesRow.amount) : null;
  const participation = (part?.[0] ?? { member_count: 0, paid_count: 0 }) as {
    member_count: number;
    paid_count: number;
  };

  // My own successful gifts (readable under RLS).
  const { data: myGifts } = await supabase
    .from("donations")
    .select("id, amount, kind, project_id, period_year, created_at")
    .eq("donor_profile_id", user.id)
    .eq("status", "success")
    .order("created_at", { ascending: false });
  const gifts = myGifts ?? [];
  const myTotal = gifts.reduce((s, g) => s + Number(g.amount), 0);
  const titleById = new Map(projects.map((p) => [p.id, p.title]));

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <section className="m-page-head">
          <div className="m-wrap">
            <div>
              <h1>Give</h1>
            </div>
            {myTotal > 0 && (
              <div style={{ textAlign: "right" }}>
                <span className="m-big m-num" style={{ fontSize: 32 }}>{ngn(myTotal)}</span>
                <div style={{ fontSize: 13, color: "var(--m-muted)" }}>
                  Your giving, all time · {gifts.length} {gifts.length === 1 ? "gift" : "gifts"}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="m-wrap m-body" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {/* Dues */}
          {myYear ? (
            <DuesCard
              userEmail={user.email ?? ""}
              year={year}
              amount={duesAmount}
              classLabel={classLabel}
              paid={Boolean(myDues)}
              memberCount={participation.member_count}
              paidCount={participation.paid_count}
            />
          ) : (
            <div className="m-card" style={{ padding: 28 }}>
              <span className="m-eyebrow">Annual dues · {year}</span>
              <p style={{ marginTop: 8, color: "#4d5358" }}>
                Your graduating class is not set yet, so dues cannot be credited to a class. Ask an administrator to set it.
              </p>
            </div>
          )}

          {/* Open projects */}
          <section className="m-stackcol">
            <div className="m-rule-h">
              <h2>Open projects</h2>
              <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
                {projects.length > 0 && `${millions(needed)} needed across ${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
                {isSuper && (
                  <>
                    {projects.length > 0 && " · "}
                    <Link className="m-link" href="/donations/manage">Manage projects</Link>
                  </>
                )}
              </span>
            </div>
            {projects.length === 0 ? (
              <div className="m-card m-empty">No projects are open right now. Please check back soon.</div>
            ) : (
              <div className="m-grid3">
                {projects.map((p) => {
                  const raised = totalById.get(p.id) ?? 0;
                  const pct = p.goal > 0 ? Math.min(100, Math.round((raised / p.goal) * 100)) : 0;
                  return (
                    <article key={p.id} className="m-card m-pcard">
                      <div className="ph">
                        <ProjectArt project={p} className="h-full w-full" />
                      </div>
                      <div className="top">
                        <span className="m-eyebrow">
                          {p.tag}
                          {!p.isPublished && <span className="m-draft"> · Draft</span>}
                        </span>
                        <h3>{p.title}</h3>
                        {(p.impact || p.tagline) && <p>{p.impact ?? p.tagline}</p>}
                      </div>
                      {p.budget.length > 0 && (
                        <div className="bot" style={{ paddingBottom: 0 }}>
                          <span className="lbl">Budget</span>
                          <BudgetStack p={p} />
                        </div>
                      )}
                      <div className="bot">
                        <div className="m-bar">
                          <span style={{ width: `${pct}%` }} />
                        </div>
                        <div className="m-row m-num">
                          <strong>{ngn(raised)}</strong>
                          <span style={{ color: "var(--m-muted)" }}>of {millions(p.goal)}</span>
                        </div>
                        <Link className="m-btn m-btn-primary m-btn-block" href={`/donations/projects/${p.slug}`}>
                          View &amp; give
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed + your gifts */}
          <section className="m-two-one">
            <div className="m-stackcol" style={{ gap: 20 }}>
              <div className="m-rule-h">
                <h2>Completed</h2>
              </div>
              <div className="m-done">
                {DONE.map((d) => (
                  <figure key={d.title}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.img} alt={`${d.title}, completed`} loading="lazy" />
                    <figcaption>
                      <b>{d.title}</b>
                      <span>Completed</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div className="m-stackcol" style={{ gap: 20 }}>
              <div className="m-rule-h">
                <h2>Your gifts</h2>
              </div>
              <div className="m-card m-links m-num">
                {gifts.length === 0 && (
                  <div className="m-empty" style={{ textAlign: "left", padding: 20 }}>
                    No gifts yet. Your receipts will appear here.
                  </div>
                )}
                {gifts.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--m-line-2)" }}
                  >
                    <span>
                      <b style={{ display: "block" }}>
                        {g.kind === "dues"
                          ? `${g.period_year ?? ""} dues`.trim()
                          : (g.project_id && titleById.get(g.project_id)) || "Project gift"}
                      </b>
                      <small>{shortDate(g.created_at)}</small>
                    </span>
                    <b>{ngn(Number(g.amount))}</b>
                  </div>
                ))}
                {(isSuper || isClassAdmin) && (
                  <Link href="/donations/reports">
                    <span>
                      <b>Giving reports</b>
                      <small>By project and by class</small>
                    </span>
                    <span className="m-link" style={{ fontSize: 13 }}>View</span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
