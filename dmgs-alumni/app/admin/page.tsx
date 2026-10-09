import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MemberRow } from "@/components/admin/MemberRow";
import { createClient } from "@/lib/supabase/server";
import { approveMember, rejectMember } from "./actions";
import { shortDate } from "@/lib/format";
import { GivingTab } from "@/components/admin/GivingTab";
import { ProjectsTab } from "@/components/admin/ProjectsTab";

export const dynamic = "force-dynamic";

type Tab = "approvals" | "members" | "giving" | "projects";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string; view?: string; project?: string; kind?: string; edit?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role, admin_of_year").eq("id", user.id).single();
  const isSuper = me?.role === "super_admin";
  const isClassAdmin = me?.role === "class_admin";
  if (!isSuper && !isClassAdmin) redirect("/home");

  // Class admins only have the giving reports for their class.
  const requested = (searchParams.tab ?? "approvals") as Tab;
  const tab: Tab = !isSuper ? "giving" : (["approvals", "members", "giving", "projects"] as Tab[]).includes(requested) ? requested : "approvals";

  const [{ count: pendingCount }, { count: memberCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const tabs: [Tab, string, number | null][] = isSuper
    ? [
        ["approvals", "Approvals", pendingCount ?? 0],
        ["members", "Members & roles", memberCount ?? 0],
        ["giving", "Giving reports", null],
        ["projects", "Projects", null],
      ]
    : [["giving", `Giving reports · Class of ${me?.admin_of_year ?? "?"}`, null]];

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <section className="m-page-head tabs">
          <div className="m-wrap">
            <h1>Manage</h1>
            <div className="m-tablist" role="tablist">
              {tabs.map(([key, label, c]) => (
                <Link key={key} href={`/admin?tab=${key}`} role="tab" aria-selected={tab === key}>
                  {label} {c !== null && <span className="c">{c}</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="m-wrap m-body">
          {tab === "approvals" && <Approvals />}
          {tab === "members" && <Members selfId={user.id} />}
          {tab === "giving" && (
            <GivingTab
              isSuper={isSuper}
              adminYear={me?.admin_of_year ?? null}
              view={searchParams.view}
              projectId={searchParams.project}
              kind={searchParams.kind}
            />
          )}
          {tab === "projects" && <ProjectsTab uid={user.id} edit={searchParams.edit} />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Approvals() {
  const supabase = createClient();
  const [{ data: pending }, { data: unclaimed }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, occupation, class_year, city, state, country, phone, bio, verification_answer, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    // Unclaimed listings imported from the OSA register, to link new members
    // to their existing listing instead of creating a duplicate.
    supabase.from("alumni").select("id, full_name, class_year").is("profile_id", null).neq("source", "member"),
  ]);
  const register = unclaimed ?? [];
  const pendingRows = pending ?? [];

  if (pendingRows.length === 0) {
    return <div className="m-card m-empty">No one is waiting. New membership requests will appear here for review.</div>;
  }
  return (
    <section className="m-stackcol" style={{ gap: 16, maxWidth: 980 }}>
      {pendingRows.map((p) => (
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
      ))}
    </section>
  );
}

async function Members({ selfId }: { selfId: string }) {
  const supabase = createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, class_year, admin_of_year")
    .eq("status", "approved")
    .order("full_name");
  return (
    <div className="m-card" style={{ overflow: "hidden" }}>
      {(members ?? []).map((m) => (
        <MemberRow key={m.id} member={m} isSelf={m.id === selfId} />
      ))}
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
