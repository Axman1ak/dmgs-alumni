import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";
import { ngn, shortDate } from "@/lib/format";
import { DuesAmountForm } from "@/components/donations/DuesAmountForm";
import { PrintButton } from "@/components/donations/PrintButton";
import { CsvButton } from "./CsvButton";
import { Expandable } from "./Expandable";

type Gift = {
  id: string;
  amount: number | string;
  kind: string;
  project_id: string | null;
  class_year: number | null;
  donor_name: string | null;
  donor_profile_id: string | null;
  is_anonymous: boolean;
  period_year: number | null;
  created_at: string;
};

type ClassTotals = {
  class_year: number;
  label: string;
  project_total: number | string;
  dues_total: number | string;
  total_amount: number | string;
  donor_count: number | string;
  goal: number | string;
};

const VIEWS = [
  ["projects", "By project"],
  ["classes", "By class"],
  ["donors", "By donor"],
  ["payments", "All payments"],
] as const;
type View = (typeof VIEWS)[number][0];

/** Real name, for admin donor reports (receipts, thanks). */
const realName = (g: Gift) => g.donor_name ?? "Member (account deleted)";
const donorKey = (g: Gift) => g.donor_profile_id ?? `name:${g.donor_name ?? "unknown"}`;
const what = (g: Gift, titleById: Map<string, string>) =>
  g.kind === "dues" ? `${g.period_year ?? ""} dues`.trim() : (g.project_id && titleById.get(g.project_id)) || "General fund";

const name = (g: Gift) => (g.is_anonymous ? "Anonymous" : g.donor_name ?? "Member");
const pctOf = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/**
 * Manage → Giving reports. Super admins see every gift; class admins see
 * their own class only (enforced by RLS on donations).
 */
export async function GivingTab({
  isSuper,
  adminYear,
  view: viewParam,
  projectId,
  kind,
  donor,
}: {
  isSuper: boolean;
  adminYear: number | null;
  view?: string;
  projectId?: string;
  kind?: string;
  donor?: string;
}) {
  const supabase = createClient();
  const year = new Date().getFullYear();
  const view: View = (VIEWS.map((v) => v[0]) as string[]).includes(viewParam ?? "") ? (viewParam as View) : "projects";

  const [{ data: giftRows }, { data: projRows }, { data: totalsRows }, { data: classRows }, { data: duesRow }, { count: memberCount }] =
    await Promise.all([
      supabase
        .from("donations")
        .select("id, amount, kind, project_id, class_year, donor_name, donor_profile_id, is_anonymous, period_year, created_at")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase.from("projects").select("*").order("sort_order"),
      supabase.rpc("project_totals"),
      supabase.rpc("class_donation_totals"),
      supabase.from("annual_dues").select("amount").eq("year", year).maybeSingle(),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    ]);

  const gifts = (giftRows ?? []) as Gift[];
  const projects = (projRows ?? []).map(mapProject);
  const raisedAll = new Map<string, number>(
    (totalsRows ?? []).map((t: { project_id: string; total: number | string }) => [t.project_id, Number(t.total)]),
  );
  const scope = isSuper ? "All classes" : `Class of ${adminYear}`;

  // This year at a glance (within scope).
  const thisYear = gifts.filter((g) => g.created_at >= `${year}-01-01`);
  const givenThisYear = thisYear.reduce((s, g) => s + Number(g.amount), 0);
  const donorsThisYear = new Set(thisYear.map((g) => g.donor_profile_id).filter(Boolean)).size;
  const duesPayers = new Set(gifts.filter((g) => g.kind === "dues" && g.period_year === year).map((g) => g.donor_profile_id)).size;

  const tabHref = (v: string, extra = "") => `/admin?tab=giving&view=${v}${extra}`;

  // ---------- single-project report ----------
  const selected = projectId ? projects.find((p) => p.id === projectId) ?? null : null;
  if (view === "projects" && (selected || projectId === "general")) {
    const list = gifts.filter((g) => g.kind === "project" && (selected ? g.project_id === selected.id : !g.project_id));
    const raisedScope = list.reduce((s, g) => s + Number(g.amount), 0);
    const raised = selected ? (isSuper ? raisedAll.get(selected.id) ?? 0 : raisedScope) : raisedScope;
    const donors = new Set(list.map((g) => g.donor_profile_id).filter(Boolean)).size;
    const byClass = new Map<string, number>();
    list.forEach((g) => {
      const k = g.class_year ? String(g.class_year) : "Unknown";
      byClass.set(k, (byClass.get(k) ?? 0) + Number(g.amount));
    });
    const title = selected ? selected.title : "General fund (gifts not tied to a project)";
    return (
      <div className="m-stackcol" style={{ gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link className="m-link" href={tabHref("projects")} style={{ fontSize: 14 }}>
            ← All projects
          </Link>
          <div style={{ display: "flex", gap: 8 }} className="m-noprint">
            <CsvButton
              filename={`${(selected?.slug ?? "general-fund")}-gifts.csv`}
              rows={[["Donor", "Class", "Amount (NGN)", "Date"], ...list.map((g) => [name(g), g.class_year, Number(g.amount), g.created_at.slice(0, 10)])]}
            />
            <PrintButton />
          </div>
        </div>
        <section className="m-card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          <span className="m-eyebrow">{selected ? `${selected.tag} · project report` : "Project report"}</span>
          <h2 style={{ fontSize: 28, color: "var(--m-emerald)" }}>{title}</h2>
          {selected && (
            <>
              <div className="m-bar" style={{ height: 10 }}>
                <span style={{ width: `${pctOf(raised, selected.goal)}%` }} />
              </div>
              <div className="m-row m-num" style={{ fontSize: 15 }}>
                <span>
                  <strong>{ngn(raised)}</strong> raised of {ngn(selected.goal)} · {pctOf(raised, selected.goal)}%
                </span>
                <span style={{ color: "var(--m-muted)" }}>{ngn(Math.max(0, selected.goal - raised))} still needed</span>
              </div>
            </>
          )}
          <div className="m-kpis m-num" style={{ border: "1px solid var(--m-line)" }}>
            <div><b>{ngn(raisedScope)}</b><span>{isSuper ? "Received" : `Received from ${scope}`}</span></div>
            <div><b>{list.length}</b><span>Gifts</span></div>
            <div><b>{donors}</b><span>Donors</span></div>
            <div><b>{list.length ? ngn(raisedScope / list.length) : "–"}</b><span>Average gift</span></div>
          </div>
        </section>

        {selected && selected.budget.length > 0 && (
          <section className="m-stackcol" style={{ gap: 12 }}>
            <h3 style={{ fontSize: 20, color: "var(--m-emerald)" }}>Budget</h3>
            <div className="m-table-wrap">
              <table className="m-table m-num">
                <thead>
                  <tr><th>Item</th><th className="r">Amount</th><th className="r">Share</th></tr>
                </thead>
                <tbody>
                  {selected.budget.map((b) => (
                    <tr key={b.label}>
                      <td>{b.label}</td>
                      <td className="r">{ngn(b.amount)}</td>
                      <td className="r">{pctOf(b.amount, selected.goal)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {byClass.size > 0 && (
          <section className="m-stackcol" style={{ gap: 12 }}>
            <h3 style={{ fontSize: 20, color: "var(--m-emerald)" }}>By class</h3>
            <div className="m-table-wrap">
              <table className="m-table m-num">
                <thead><tr><th>Class</th><th className="r">Amount</th></tr></thead>
                <tbody>
                  {Array.from(byClass.entries()).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <tr key={k}><td>{k === "Unknown" ? "Class not set" : `Class of ${k}`}</td><td className="r">{ngn(v)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="m-stackcol" style={{ gap: 12 }}>
          <h3 style={{ fontSize: 20, color: "var(--m-emerald)" }}>Gifts</h3>
          <GiftTable rows={list} showClass showWhat={false} titleById={new Map()} />
        </section>
      </div>
    );
  }

  // ---------- one donor ----------
  if (view === "donors" && donor) {
    const titleById = new Map(projects.map((p) => [p.id, p.title]));
    const list = gifts.filter((g) => donorKey(g) === donor);
    const total = list.reduce((s, g) => s + Number(g.amount), 0);
    const who = list[0] ? realName(list[0]) : "Unknown donor";
    const where = new Map<string, number>();
    list.forEach((g) => {
      const k = what(g, titleById);
      where.set(k, (where.get(k) ?? 0) + Number(g.amount));
    });
    const anon = list.some((g) => g.is_anonymous);
    return (
      <div className="m-stackcol" style={{ gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link className="m-link" href={tabHref("donors")} style={{ fontSize: 14 }}>
            ← All donors
          </Link>
          <div style={{ display: "flex", gap: 8 }} className="m-noprint">
            <CsvButton
              filename={`${who.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-gifts.csv`}
              rows={[["For", "Amount (NGN)", "Date", "Anonymous"], ...list.map((g) => [what(g, titleById), Number(g.amount), g.created_at.slice(0, 10), g.is_anonymous ? "yes" : "no"])]}
            />
            <PrintButton />
          </div>
        </div>
        <section className="m-card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          <span className="m-eyebrow">Donor report</span>
          <h2 style={{ fontSize: 28, color: "var(--m-emerald)" }}>{who}</h2>
          <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
            {list[0]?.class_year ? `Class of ${list[0].class_year}` : "Class not set"}
            {anon ? " · some gifts were made anonymously (their name is hidden from other members)" : ""}
          </span>
          <div className="m-kpis m-num m-kpis4" style={{ border: "1px solid var(--m-line)" }}>
            <div><b>{ngn(total)}</b><span>Given in total</span></div>
            <div><b>{list.length}</b><span>Gifts</span></div>
            <div><b>{list.length ? shortDate(list[list.length - 1].created_at) : "–"}</b><span>First gift</span></div>
            <div><b>{list.length ? shortDate(list[0].created_at) : "–"}</b><span>Latest gift</span></div>
          </div>
        </section>
        <section className="m-stackcol" style={{ gap: 12 }}>
          <h3 style={{ fontSize: 20, color: "var(--m-emerald)" }}>Where they gave</h3>
          <div className="m-table-wrap">
            <table className="m-table m-num">
              <thead><tr><th>For</th><th className="r">Amount</th><th className="r">Share</th></tr></thead>
              <tbody>
                {Array.from(where.entries()).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td className="r"><b>{ngn(v)}</b></td><td className="r">{pctOf(v, total)}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="m-stackcol" style={{ gap: 12 }}>
          <h3 style={{ fontSize: 20, color: "var(--m-emerald)" }}>All gifts</h3>
          <div className="m-table-wrap">
            <table className="m-table m-num">
              <thead><tr><th>For</th><th className="r">Amount</th><th className="r">Date</th></tr></thead>
              <tbody>
                {list.map((g) => (
                  <tr key={g.id}>
                    <td>{what(g, titleById)}{g.is_anonymous && <span style={{ color: "var(--m-muted)", fontSize: 13 }}> · anonymous</span>}</td>
                    <td className="r"><b>{ngn(Number(g.amount))}</b></td>
                    <td className="r">{shortDate(g.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // ---------- overview ----------
  return (
    <div className="m-stackcol" style={{ gap: 24 }}>
      <div className="m-card m-kpis m-num m-kpis4">
        <div><b>{ngn(givenThisYear)}</b><span>Given in {year}{isSuper ? "" : ` · ${scope}`}</span></div>
        <div><b>{donorsThisYear}</b><span>Donors in {year}</span></div>
        <div><b>{isSuper ? `${duesPayers} / ${memberCount ?? 0}` : duesPayers}</b><span>{isSuper ? "Members who paid dues" : "Paid dues this year"}</span></div>
        <div><b>{duesRow ? ngn(Number(duesRow.amount)) : "Not set"}</b><span>{year} dues amount</span></div>
      </div>

      {isSuper && <DuesAmountForm year={year} amount={duesRow ? Number(duesRow.amount) : null} />}

      <div className="m-seg" role="tablist" aria-label="Report view">
        {VIEWS.map(([v, label]) => (
          <Link key={v} href={tabHref(v)} role="tab" aria-selected={view === v}>
            {label}
          </Link>
        ))}
      </div>

      {view === "projects" && (
        <ProjectsTable projects={projects} gifts={gifts} raisedAll={raisedAll} isSuper={isSuper} tabHref={tabHref} />
      )}
      {view === "classes" && (
        <ClassesTable rows={(classRows ?? []) as ClassTotals[]} isSuper={isSuper} adminYear={adminYear} />
      )}
      {view === "donors" && <DonorsTable gifts={gifts} projects={projects} isSuper={isSuper} tabHref={tabHref} />}
      {view === "payments" && (
        <PaymentsView gifts={gifts} kind={kind} projects={projects} isSuper={isSuper} tabHref={tabHref} />
      )}
    </div>
  );
}

function ProjectsTable({
  projects,
  gifts,
  raisedAll,
  isSuper,
  tabHref,
}: {
  projects: ReturnType<typeof mapProject>[];
  gifts: Gift[];
  raisedAll: Map<string, number>;
  isSuper: boolean;
  tabHref: (v: string, extra?: string) => string;
}) {
  const general = gifts.filter((g) => g.kind === "project" && !g.project_id);
  const rows = projects.map((p) => {
    const list = gifts.filter((g) => g.project_id === p.id);
    const last = list[0]?.created_at ?? null;
    return { p, raised: isSuper ? raisedAll.get(p.id) ?? 0 : list.reduce((s, g) => s + Number(g.amount), 0), gifts: list.length, donors: new Set(list.map((g) => g.donor_profile_id).filter(Boolean)).size, last };
  });
  return (
    <div className="m-table-wrap">
      <table className="m-table m-num">
        <thead>
          <tr>
            <th>Project</th>
            <th className="r">Raised</th>
            <th className="r">Goal</th>
            <th className="r">Funded</th>
            <th className="r">Gifts</th>
            <th className="r">Donors</th>
            <th>Last gift</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, raised, gifts: n, donors, last }) => (
            <tr key={p.id}>
              <td>
                <b>{p.title}</b>
                {!p.isPublished && <span className="m-draft"> · Draft</span>}
              </td>
              <td className="r">{ngn(raised)}</td>
              <td className="r">{ngn(p.goal)}</td>
              <td className="r">{pctOf(raised, p.goal)}%</td>
              <td className="r">{n}</td>
              <td className="r">{donors}</td>
              <td>{last ? shortDate(last) : "–"}</td>
              <td className="r"><Link className="m-link" style={{ fontSize: 14 }} href={tabHref("projects", `&project=${p.id}`)}>Report →</Link></td>
            </tr>
          ))}
          {general.length > 0 && (
            <tr>
              <td><b>General fund</b> <span style={{ color: "var(--m-muted)", fontSize: 13 }}>(no project)</span></td>
              <td className="r">{ngn(general.reduce((s, g) => s + Number(g.amount), 0))}</td>
              <td className="r">–</td>
              <td className="r">–</td>
              <td className="r">{general.length}</td>
              <td className="r">{new Set(general.map((g) => g.donor_profile_id).filter(Boolean)).size}</td>
              <td>{shortDate(general[0].created_at)}</td>
              <td className="r"><Link className="m-link" style={{ fontSize: 14 }} href={tabHref("projects", "&project=general")}>Report →</Link></td>
            </tr>
          )}
          {rows.length === 0 && general.length === 0 && (
            <tr><td colSpan={8} style={{ color: "var(--m-muted)" }}>No projects yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClassesTable({ rows, isSuper, adminYear }: { rows: ClassTotals[]; isSuper: boolean; adminYear: number | null }) {
  const list = rows
    .map((t) => ({
      year: t.class_year,
      label: t.label,
      projects: Number(t.project_total),
      dues: Number(t.dues_total),
      total: Number(t.total_amount),
      donors: Number(t.donor_count),
      goal: Number(t.goal),
    }))
    .filter((t) => t.goal > 0 || t.total > 0)
    .sort((a, b) => b.total - a.total);
  if (list.length === 0) return <div className="m-card m-empty">No class has given yet.</div>;
  return (
    <div className="m-stackcol" style={{ gap: 10 }}>
      <div className="m-table-wrap">
        <table className="m-table m-num">
          <thead>
            <tr>
              <th>Class</th>
              <th className="r">Projects</th>
              <th className="r">Dues</th>
              <th className="r">Total</th>
              <th className="r">Donors</th>
              <th className="r">Class goal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <Expandable initial={15} step={15} noun="classes" colSpan={7} labels={list.map((c) => `${c.label} ${c.year}`)} searchPlaceholder="Find a class, e.g. 1978">
            {list.map((c) => (
              <tr key={c.year}>
                <td><b>{c.label}</b></td>
                <td className="r">{ngn(c.projects)}</td>
                <td className="r">{ngn(c.dues)}</td>
                <td className="r"><b>{ngn(c.total)}</b></td>
                <td className="r">{c.donors}</td>
                <td className="r">{c.goal > 0 ? `${pctOf(c.projects, c.goal)}% of ${ngn(c.goal)}` : "–"}</td>
                <td className="r">
                  {(isSuper || c.year === adminYear) && (
                    <Link className="m-link" style={{ fontSize: 14 }} href={`/donations/report/${c.year}`}>
                      Printable report →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            </Expandable>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, color: "var(--m-muted)" }}>
        Members see each class&rsquo;s totals. Individual donors are visible only to that class&rsquo;s administrator
        {isSuper ? " and to super admins" : ""}.
      </p>
    </div>
  );
}

function PaymentsView({
  gifts,
  kind,
  projects,
  isSuper,
  tabHref,
}: {
  gifts: Gift[];
  kind?: string;
  projects: ReturnType<typeof mapProject>[];
  isSuper: boolean;
  tabHref: (v: string, extra?: string) => string;
}) {
  const titleById = new Map(projects.map((p) => [p.id, p.title]));
  const list = kind === "dues" || kind === "project" ? gifts.filter((g) => g.kind === kind) : gifts;
  const what = (g: Gift) => (g.kind === "dues" ? `${g.period_year ?? ""} dues`.trim() : (g.project_id && titleById.get(g.project_id)) || "General fund");
  return (
    <div className="m-stackcol" style={{ gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
          {[["", "All"], ["project", "Project gifts"], ["dues", "Dues"]].map(([k, l]) => (
            <Link
              key={k}
              href={tabHref("payments", k ? `&kind=${k}` : "")}
              className="m-link"
              style={{ fontSize: 14, color: (kind ?? "") === k ? "var(--m-emerald)" : "var(--m-muted)", textDecoration: (kind ?? "") === k ? "underline" : "none" }}
            >
              {l}
            </Link>
          ))}
        </div>
        <CsvButton
          filename={`payments${kind ? `-${kind}` : ""}.csv`}
          label="Export CSV for the treasurer"
          rows={[["Donor", "For", "Class", "Amount (NGN)", "Date"], ...list.map((g) => [name(g), what(g), g.class_year, Number(g.amount), g.created_at.slice(0, 10)])]}
        />
      </div>
      <GiftTable rows={list} showClass={isSuper} showWhat titleById={titleById} />
    </div>
  );
}

function DonorsTable({
  gifts,
  projects,
  isSuper,
  tabHref,
}: {
  gifts: Gift[];
  projects: ReturnType<typeof mapProject>[];
  isSuper: boolean;
  tabHref: (v: string, extra?: string) => string;
}) {
  const titleById = new Map(projects.map((p) => [p.id, p.title]));
  const byDonor = new Map<string, { key: string; name: string; classYear: number | null; total: number; gifts: number; places: Set<string>; last: string }>();
  for (const g of gifts) {
    const k = donorKey(g);
    const d = byDonor.get(k) ?? { key: k, name: realName(g), classYear: g.class_year, total: 0, gifts: 0, places: new Set<string>(), last: g.created_at };
    d.total += Number(g.amount);
    d.gifts += 1;
    d.places.add(what(g, titleById));
    if (g.created_at > d.last) d.last = g.created_at;
    byDonor.set(k, d);
  }
  const rows = Array.from(byDonor.values()).sort((a, b) => b.total - a.total);
  if (rows.length === 0) return <div className="m-card m-empty">No gifts recorded yet.</div>;
  return (
    <div className="m-stackcol" style={{ gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
          {rows.length} {rows.length === 1 ? "donor" : "donors"} · sorted by total given
        </span>
        <CsvButton
          filename="donors.csv"
          rows={[["Donor", "Class", "Total (NGN)", "Gifts", "Gave to", "Latest gift"], ...rows.map((d) => [d.name, d.classYear, d.total, d.gifts, Array.from(d.places).join("; "), d.last.slice(0, 10)])]}
        />
      </div>
      <div className="m-table-wrap">
        <table className="m-table m-num">
          <thead>
            <tr>
              <th>Donor</th>
              {isSuper && <th>Class</th>}
              <th className="r">Total</th>
              <th className="r">Gifts</th>
              <th>Gave to</th>
              <th>Latest</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <Expandable
              initial={25}
              step={25}
              noun="donors"
              colSpan={isSuper ? 7 : 6}
              labels={rows.map((d) => `${d.name} ${d.classYear ?? ""}`)}
              searchPlaceholder="Find a donor by name or class"
            >
              {rows.map((d) => (
                <tr key={d.key}>
                  <td><b>{d.name}</b></td>
                  {isSuper && <td>{d.classYear ?? "–"}</td>}
                  <td className="r"><b>{ngn(d.total)}</b></td>
                  <td className="r">{d.gifts}</td>
                  <td style={{ maxWidth: 280 }}>{Array.from(d.places).join(", ")}</td>
                  <td>{shortDate(d.last)}</td>
                  <td className="r">
                    <Link className="m-link" style={{ fontSize: 14 }} href={tabHref("donors", `&donor=${encodeURIComponent(d.key)}`)}>
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </Expandable>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, color: "var(--m-muted)" }}>
        Admin view: donors who chose to give anonymously are named here so you can thank them and issue receipts. Their names stay hidden from other members.
      </p>
    </div>
  );
}

function GiftTable({
  rows,
  showClass,
  showWhat,
  titleById,
}: {
  rows: Gift[];
  showClass: boolean;
  showWhat: boolean;
  titleById: Map<string, string>;
}) {
  if (rows.length === 0) return <div className="m-card m-empty">No payments recorded yet.</div>;
  return (
    <div className="m-table-wrap">
      <table className="m-table m-num">
        <thead>
          <tr>
            <th>Donor</th>
            {showWhat && <th>For</th>}
            {showClass && <th>Class</th>}
            <th className="r">Amount</th>
            <th className="r">Date</th>
          </tr>
        </thead>
        <tbody>
          <Expandable initial={25} step={50} noun="payments" colSpan={2 + (showWhat ? 1 : 0) + (showClass ? 1 : 0) + 1}>
          {rows.map((g) => (
            <tr key={g.id}>
              <td>{name(g)}</td>
              {showWhat && (
                <td>{g.kind === "dues" ? `${g.period_year ?? ""} dues` : (g.project_id && titleById.get(g.project_id)) || "General fund"}</td>
              )}
              {showClass && <td>{g.class_year ?? "–"}</td>}
              <td className="r"><b>{ngn(Number(g.amount))}</b></td>
              <td className="r">{shortDate(g.created_at)}</td>
            </tr>
          ))}
          </Expandable>
        </tbody>
      </table>
    </div>
  );
}
