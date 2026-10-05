import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MemberRow } from "@/components/admin/MemberRow";
import { createClient } from "@/lib/supabase/server";
import { approveMember, rejectMember } from "./actions";
import { ngn, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab === "members" ? "members" : "approvals";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "super_admin") redirect("/directory");

  const { data: pending } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, occupation, class_year, city, state, country, phone, bio, verification_answer, created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, class_year, admin_of_year, approved_at")
    .eq("status", "approved")
    .order("full_name");

  // Unclaimed listings imported from the OSA register. Each pending member is
  // compared against these so the admin can link them to their existing
  // listing instead of creating a duplicate.
  const { data: unclaimed } = await supabase
    .from("alumni")
    .select("id, full_name, class_year")
    .is("profile_id", null)
    .neq("source", "member");
  const register = unclaimed ?? [];

  const pendingRows = pending ?? [];
  const memberRows = members ?? [];

  // This year at a glance (super admins can read every donation).
  const year = new Date().getFullYear();
  const [{ data: gifts }, { data: projects }] = await Promise.all([
    supabase
      .from("donations")
      .select("id, amount, kind, donor_name, donor_profile_id, is_anonymous, project_id, period_year, created_at")
      .eq("status", "success")
      .gte("created_at", `${year}-01-01`)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, title"),
  ]);
  const giftRows = gifts ?? [];
  const givenThisYear = giftRows.reduce((s, g) => s + Number(g.amount), 0);
  const donors = new Set(giftRows.map((g) => g.donor_profile_id).filter(Boolean)).size;
  const duesPayers = new Set(giftRows.filter((g) => g.kind === "dues" && g.period_year === year).map((g) => g.donor_profile_id)).size;
  const monthStart = new Date(year, new Date().getMonth(), 1).toISOString();
  const newThisMonth = memberRows.filter((m) => m.approved_at && m.approved_at >= monthStart).length;
  const titleById = new Map((projects ?? []).map((p) => [p.id, p.title as string]));

  const tabs: [string, string, number | null][] = [
    ["/admin", "Approvals", pendingRows.length],
    ["/admin?tab=members", "Members & roles", memberRows.length],
  ];

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <section className="m-page-head tabs">
          <div className="m-wrap">
            <h1>Manage</h1>
            <div className="m-tablist" role="tablist">
              {tabs.map(([href, label, c], i) => (
                <Link key={href} href={href} role="tab" aria-selected={(i === 0) === (tab === "approvals")}>
                  {label} {c !== null && <span className="c">{c}</span>}
                </Link>
              ))}
              <Link href="/donations/reports" role="tab" aria-selected={false}>Giving reports</Link>
              <Link href="/donations/manage" role="tab" aria-selected={false}>Projects</Link>
              <Link href="/events" role="tab" aria-selected={false}>Events</Link>
            </div>
          </div>
        </section>

        <div className="m-wrap m-body">
          {tab === "members" ? (
            <section className="m-stackcol" style={{ gap: 16 }}>
              <p style={{ fontSize: 14, color: "var(--m-muted)", maxWidth: 760 }}>
                A <strong>class admin</strong> needs a graduating year and can then see that class&rsquo;s donors and
                reports. A <strong>super admin</strong> has full control. Deleting a member removes their account and
                directory listing; their donation records are kept so class totals stay accurate.
              </p>
              <div className="m-card" style={{ overflow: "hidden" }}>
                {memberRows.map((m) => (
                  <MemberRow key={m.id} member={m} isSelf={m.id === user.id} />
                ))}
              </div>
            </section>
          ) : (
            <div className="m-adm">
              <section className="m-stackcol" style={{ gap: 16 }}>
                <div className="m-rule-h" style={{ borderTop: 0, paddingTop: 0 }}>
                  <h2 style={{ fontSize: 26 }}>Waiting for approval</h2>
                </div>
                {pendingRows.length === 0 ? (
                  <div className="m-card m-empty">No one is waiting. New requests will appear here for review.</div>
                ) : (
                  pendingRows.map((p) => (
                    <article key={p.id} className="m-card m-req">
                      <div className="top">
                        <div style={{ minWidth: 0 }}>
                          <h3>{p.full_name}</h3>
                          <p>
                            {[
                              p.class_year ? `Class of ${p.class_year}` : "Class not given",
                              p.occupation,
                              [p.state ?? p.city, p.country].filter(Boolean).join(", "),
                              `requested ${shortDate(p.created_at)}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p>{p.email}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <form action={approveMember} id={`approve-${p.id}`}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="m-btn m-btn-primary">Approve</button>
                          </form>
                          <form action={rejectMember}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="m-btn m-btn-line" style={{ color: "#8a2a2a" }}>Reject</button>
                          </form>
                        </div>
                      </div>
                      <div className="mid">
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <span className="lbl">Identity check · senior prefect in final year</span>
                          <b style={{ color: "var(--m-emerald)" }}>{p.verification_answer || "(not answered)"}</b>
                          {p.bio && <p style={{ fontSize: 14, color: "#4d5358", marginTop: 8 }}>{p.bio}</p>}
                          {p.phone && <span style={{ fontSize: 13, color: "var(--m-muted)" }}>Phone: {p.phone}</span>}
                        </div>
                        <RegisterMatch formId={`approve-${p.id}`} matches={findMatches(p.full_name, p.class_year, register)} />
                      </div>
                    </article>
                  ))
                )}
              </section>

              <aside className="m-stackcol" style={{ gap: 16 }}>
                <div className="m-rule-h" style={{ borderTop: 0, paddingTop: 0 }}>
                  <h2 style={{ fontSize: 26 }}>This year at a glance</h2>
                </div>
                <div className="m-card m-kpis m-num">
                  <div><b>{ngn(givenThisYear)}</b><span>Given in {year}</span></div>
                  <div><b>{donors}</b><span>Donors</span></div>
                  <div><b>{duesPayers} / {memberRows.length}</b><span>Members who paid dues</span></div>
                  <div><b>{newThisMonth}</b><span>New members this month</span></div>
                </div>
                <div className="m-card m-ledger m-num">
                  <div style={{ fontWeight: 700, borderBottom: "1px solid var(--m-line)" }}>
                    <span>Latest payments</span>
                    <span />
                    <Link className="m-link" href="/donations/reports" style={{ fontSize: 14 }}>Full ledger →</Link>
                  </div>
                  {giftRows.length === 0 && <div style={{ display: "block", color: "var(--m-muted)" }}>No payments yet this year.</div>}
                  {giftRows.slice(0, 6).map((g) => (
                    <div key={g.id}>
                      <b style={{ fontWeight: 600 }}>{g.is_anonymous ? "Anonymous" : g.donor_name ?? "Member"}</b>
                      <span style={{ color: "var(--m-muted)" }}>
                        {g.kind === "dues" ? `${g.period_year ?? year} dues` : (g.project_id && titleById.get(g.project_id)) || "Project"}
                      </span>
                      <b style={{ textAlign: "right" }}>{ngn(Number(g.amount))}</b>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-sans text-[14px] text-ink">
        {value || <span style={{ color: "var(--m-muted)" }}>Not given</span>}
      </dd>
    </div>
  );
}

type RegisterRow = { id: string; full_name: string; class_year: number | null };
type Match = RegisterRow & { score: number };

function words(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z]+/)
    .filter((w) => w.length > 1);
}

/**
 * Likely register listings for a new member: surname match is the strongest
 * signal, then first name, then graduating year. Initials are ignored because
 * the register often abbreviates middle names.
 */
function findMatches(fullName: string, year: number | null, rows: RegisterRow[]): Match[] {
  const w = words(fullName);
  if (w.length === 0) return [];
  const first = w[0];
  const last = w[w.length - 1];
  return rows
    .map((r) => {
      const rw = words(r.full_name);
      let score = 0;
      if (rw.includes(last)) score += 2;
      if (rw.includes(first)) score += 2;
      if (year && r.class_year === year) score += 1;
      return { ...r, score };
    })
    .filter((m) => m.score >= 3)
    .sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name))
    .slice(0, 5);
}

function RegisterMatch({ formId, matches }: { formId: string; matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="lbl">Match in the OSA register</span>
        <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
          No likely match. Approving creates a new directory listing.
        </span>
      </div>
    );
  }
  // Pre-select only a clear winner; ties (e.g. two "Emmanuel Ajayi", 1978)
  // are left for the admin to decide.
  const clear = matches[0].score >= 4 && (matches.length === 1 || matches[1].score < matches[0].score);
  const best = clear ? matches[0].id : "new";
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
      <legend className="lbl" style={{ paddingBottom: 6 }}>
        Match in the OSA register
      </legend>
      <div>
        {matches.map((m) => (
          <label key={m.id} className="m-radio">
            <input
              type="radio"
              name="link_alumni_id"
              value={m.id}
              form={formId}
              defaultChecked={m.id === best}
            />
            <span>
              Link to <strong>{m.full_name}</strong>
              <span style={{ color: "var(--m-muted)" }}>
                {" "}&middot; {m.class_year ? `Class of ${m.class_year}` : "year unknown"}
              </span>
            </span>
          </label>
        ))}
        <label className="m-radio">
          <input
            type="radio"
            name="link_alumni_id"
            value="new"
            form={formId}
            defaultChecked={best === "new"}
          />
          <span>Not on the register, create a new listing</span>
        </label>
      </div>
    </fieldset>
  );
}
