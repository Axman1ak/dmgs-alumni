import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProfileNotice } from "@/components/home/ProfileNotice";
import { createClient } from "@/lib/supabase/server";
import { rsvpToggle } from "@/app/events/actions";
import { profilePct } from "@/lib/completeness";
import { initials } from "@/lib/options";
import { startOfTodayLagos } from "@/lib/events";

export const dynamic = "force-dynamic";

const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-US");
const millions = (n: number) => "₦" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Member home: a personal dashboard. Your impact (or an invitation to make a
 * first gift), what's coming up, and how your class is doing.
 */
export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const year = new Date().getFullYear();

  const [{ data: profile }, { data: mine }] = await Promise.all([
    supabase.from("profiles").select("full_name, first_name, class_year, approved_at, created_at").eq("id", user.id).single(),
    supabase
      .from("alumni")
      .select("first_name, last_name, class_year, country, state, industry, job_title, employer, interests, connect_pref, linkedin_url, social_url")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const classYear = mine?.class_year ?? profile?.class_year ?? null;
  const firstName = profile?.first_name || (profile?.full_name ?? "").split(" ")[0] || "there";
  const since = new Date(profile?.approved_at ?? profile?.created_at ?? Date.now()).getFullYear();

  const [
    { data: gifts },
    { data: projRows },
    { data: totals },
    { data: duesRow },
    { data: part },
    { data: events },
    { data: myRsvps },
    { count: onRegister },
    { data: classmates },
  ] = await Promise.all([
    supabase.from("donations").select("amount, kind, project_id, period_year").eq("donor_profile_id", user.id).eq("status", "success"),
    supabase.from("projects").select("id, slug, tag, title, goal, photo_url, is_published, sort_order").eq("is_published", true).order("sort_order"),
    supabase.rpc("project_totals"),
    supabase.from("annual_dues").select("amount").eq("year", year).maybeSingle(),
    supabase.rpc("class_dues_participation", { p_year: year }),
    supabase.from("events").select("id, title, starts_at, format, location").eq("status", "scheduled").gte("starts_at", startOfTodayLagos()).order("starts_at").limit(3),
    supabase.from("event_rsvps").select("event_id").eq("profile_id", user.id),
    classYear
      ? supabase.from("alumni").select("id", { count: "exact", head: true }).eq("class_year", classYear)
      : Promise.resolve({ count: 0 }),
    classYear
      ? supabase.from("alumni").select("id, full_name, photo_url").eq("class_year", classYear).not("profile_id", "is", null).neq("profile_id", user.id).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] as { id: string; full_name: string; photo_url: string | null }[] }),
  ]);

  // Attendee counts for the upcoming events.
  const eventIds = (events ?? []).map((e) => e.id);
  const { data: allRsvps } = eventIds.length
    ? await supabase.from("event_rsvps").select("event_id").in("event_id", eventIds)
    : { data: [] as { event_id: string }[] };
  const goingCount = new Map<string, number>();
  (allRsvps ?? []).forEach((r) => goingCount.set(r.event_id, (goingCount.get(r.event_id) ?? 0) + 1));
  const iGo = new Set((myRsvps ?? []).map((r) => r.event_id));

  // My giving.
  const giftRows = gifts ?? [];
  const total = giftRows.reduce((s, g) => s + Number(g.amount), 0);
  const byProject = new Map<string, number>();
  giftRows.filter((g) => g.kind === "project" && g.project_id).forEach((g) => byProject.set(g.project_id!, (byProject.get(g.project_id!) ?? 0) + Number(g.amount)));
  const duesYears = Array.from(new Set(giftRows.filter((g) => g.kind === "dues" && g.period_year).map((g) => g.period_year as number))).sort();
  const paidThisYear = duesYears.includes(year);
  const duesAmount = duesRow ? Number(duesRow.amount) : null;

  const raised = new Map<string, number>((totals ?? []).map((t: { project_id: string; total: number | string }) => [t.project_id, Number(t.total)]));
  const projects = (projRows ?? []).map((p) => ({ ...p, goal: Number(p.goal), raised: raised.get(p.id) ?? 0, mine: byProject.get(p.id) ?? 0 }));
  const supported = projects.filter((p) => p.mine > 0).length;
  // Gifts not tied to a project (early gifts, general fund).
  const general = giftRows.filter((g) => g.kind === "project" && !g.project_id).reduce((s, g) => s + Number(g.amount), 0);
  // Projects you supported first, so a gift is never hidden behind the first three.
  const shown = [...projects.filter((p) => p.mine > 0), ...projects.filter((p) => p.mine === 0)].slice(0, general > 0 ? 2 : 3);

  const participation = (part?.[0] ?? { member_count: 0, paid_count: 0 }) as { member_count: number; paid_count: number };
  const joinedCount = participation.member_count;
  const pct = profilePct(mine);

  const pctOf = (p: { raised: number; goal: number }) => (p.goal > 0 ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0);

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <ProfileNotice pct={pct} userId={user.id} />
        <section className="m-page-head">
          <div className="m-wrap" style={{ alignItems: "center" }}>
            <div>
              <h1>Welcome back, {firstName}.</h1>
              <p className="sub">
                {classYear ? `Class of ${classYear} · ` : ""}Member since {since}
              </p>
            </div>
          </div>
        </section>

        <div className="m-wrap m-body m-dash">
          {/* YOUR IMPACT */}
          <section className="m-impact">
            {total > 0 ? (
              <div className="m-im-left">
                <span className="lbl">Your impact</span>
                <span className="m-im-total m-num">{naira(total)}</span>
                <span className="m-im-sub">
                  given to Doherty · {supported} of {projects.length} projects supported
                  {duesYears.length ? ` · dues paid for ${duesYears.join(", ")}` : ""}
                </span>
                <Link className="m-link" href="/donations" style={{ color: "#fff", fontSize: 14, marginTop: 6 }}>
                  My giving →
                </Link>
              </div>
            ) : (
              <div className="m-im-left">
                <span className="lbl">Your impact</span>
                <span className="m-im-first">Make your first gift to Doherty</span>
                <span className="m-im-sub">
                  {duesAmount
                    ? `Your annual dues of ${naira(duesAmount)} are the simplest way to start.`
                    : "Every project publishes its full budget, and receipts are shared back with donors."}
                  {participation.paid_count > 0 ? ` ${participation.paid_count} of your classmates have already paid this year.` : ""}
                </span>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {duesAmount && !paidThisYear && (
                    <Link className="m-btn m-btn-gold" href="/donations/dues">
                      Pay {naira(duesAmount)} dues
                    </Link>
                  )}
                  <Link className="m-btn m-btn-ghost" href="/donations">
                    See projects
                  </Link>
                </div>
              </div>
            )}
            <div className="m-im-proj">
              {general > 0 && (
                <Link className="m-ip on" href="/donations">
                  <span className="m-ip-img" />
                  <span className="m-ip-t">
                    <b>General fund</b>
                    <span>You gave {naira(general)}</span>
                    <span className="m-ip-s">Used where the school needs it most</span>
                  </span>
                </Link>
              )}
              {shown.map((p) =>
                p.mine > 0 || total === 0 ? (
                  <Link key={p.id} className="m-ip on" href={`/donations/projects/${p.slug}`}>
                    <span className="m-ip-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.photo_url ? <img src={p.photo_url} alt="" /> : null}
                    </span>
                    <span className="m-ip-t">
                      <b>{p.tag}</b>
                      <span>{p.mine > 0 ? `You gave ${naira(p.mine)}` : `${millions(p.goal)} needed`}</span>
                      <span className="m-ip-bar"><span style={{ width: `${pctOf(p)}%` }} /></span>
                      <span className="m-ip-s">{pctOf(p)}% funded{p.mine > 0 ? "" : " · Give →"}</span>
                    </span>
                  </Link>
                ) : (
                  <Link key={p.id} className="m-ip off" href={`/donations/projects/${p.slug}`}>
                    <span className="m-ip-plus" aria-hidden="true">+</span>
                    <span className="m-ip-t">
                      <b>{p.tag}</b>
                      <span>Not supported yet</span>
                      <span className="m-ip-s">Give to this project →</span>
                    </span>
                  </Link>
                ),
              )}
            </div>
          </section>

          <div className="m-two">
            {/* COMING UP */}
            <section className="m-blk">
              <div className="m-rule-h">
                <h2>Coming up</h2>
                <Link className="m-link" href="/events">All events →</Link>
              </div>
              {(events ?? []).length === 0 ? (
                <p style={{ color: "var(--m-muted)" }}>No events scheduled yet. New reunions and meetings will appear here.</p>
              ) : (
                <ul className="m-steps">
                  {(events ?? []).map((e) => {
                    const d = new Date(e.starts_at);
                    const going = iGo.has(e.id);
                    const n = goingCount.get(e.id) ?? 0;
                    return (
                      <li key={e.id}>
                        <span className="m-date">
                          <span className="m">{MONTHS[d.getMonth()]}</span>
                          <span className="d">{d.getDate()}</span>
                        </span>
                        <span className="m-st-t">
                          <b>{e.title}</b>
                          <span>
                            {d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}
                            {e.location ? ` · ${e.location}` : ""}
                            {e.format === "virtual" ? " · Online" : e.format === "hybrid" ? " · also online" : ""}
                          </span>
                          <span>{going ? (n > 1 ? `You and ${n - 1} others are going` : "You are going") : `${n} going`}</span>
                        </span>
                        <form action={rsvpToggle}>
                          <input type="hidden" name="event_id" value={e.id} />
                          <input type="hidden" name="going" value={going ? "false" : "true"} />
                          <button type="submit" className={`m-btn m-btn-sm ${going ? "m-btn-line" : "m-btn-primary"}`}>
                            {going ? "Going ✓" : "I am going"}
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* YOUR CLASS */}
            <section className="m-blk">
              <div className="m-rule-h">
                <h2>{classYear ? `Your class · ${classYear}` : "Your class"}</h2>
                <Link className="m-link" href={classYear ? `/directory?class=${classYear}` : "/directory"}>Classmates →</Link>
              </div>
              {classYear ? (
                <>
                  <div className="m-cl-figs m-num">
                    <div><b>{onRegister ?? 0}</b><span>on the register</span></div>
                    <div><b>{joinedCount}</b><span>have joined</span></div>
                    <div><b>{participation.paid_count}/{joinedCount || 0}</b><span>paid {year} dues</span></div>
                  </div>
                  <div className="m-bar"><span style={{ width: `${joinedCount ? Math.round((participation.paid_count / joinedCount) * 100) : 0}%`, background: "var(--m-emerald)" }} /></div>
                  {duesAmount && (
                    <div className={`m-cl-dues ${paidThisYear ? "ok" : ""}`}>
                      {paidThisYear ? (
                        <span>You have paid your {year} dues. Thank you.</span>
                      ) : (
                        <>
                          <span>Your {year} dues ({naira(duesAmount)}) are not paid yet.</span>
                          <Link className="m-btn m-btn-gold m-btn-sm" href="/donations/dues">Pay dues</Link>
                        </>
                      )}
                    </div>
                  )}
                  {(classmates ?? []).length > 0 && (
                    <div className="m-faces">
                      {(classmates ?? []).map((c) => (
                        <Link key={c.id} href={`/directory?person=${c.id}`} className="m-avatar" title={c.full_name} style={{ width: 40, height: 40, fontSize: 14, textDecoration: "none" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {c.photo_url ? <img src={c.photo_url} alt={c.full_name} /> : initials(c.full_name)}
                        </Link>
                      ))}
                      <span className="lbl">Recently joined</span>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: "var(--m-muted)" }}>Your class year is not set yet. An administrator can add it.</p>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
