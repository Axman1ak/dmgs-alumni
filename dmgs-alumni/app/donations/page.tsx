import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GiveForm } from "@/components/donations/GiveForm";
import { SupportedProjects } from "@/components/donations/SupportedProjects";
import { Reveal } from "@/components/donations/Reveal";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";
import { ngn, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Photographs of the association's own work on campus (from the OSA's North
// America zone site). Deliberately different from the landing page's imagery so
// the Donations tab has its own identity. Self-host these in /public when you
// have the originals.
const HERO_IMG =
  "https://static.wixstatic.com/media/2a4bdb_909f206c54af4a2989b7e4a29c5961dc~mv2.jpg";

type Totals = {
  class_year: number;
  label: string;
  total_amount: number | string;
  donor_count: number | string;
  goal: number | string;
};

type Donation = {
  id: string;
  donor_name: string | null;
  is_anonymous: boolean;
  class_year: number | null;
  amount: number;
  status: string;
  created_at: string;
};

export default async function DonationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, class_year, admin_of_year, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "member";
  const isSuper = role === "super_admin";
  const isClassAdmin = role === "class_admin";
  const adminYear = profile?.admin_of_year ?? null;

  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;

  const { data: projRows } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order");
  const projects = (projRows ?? [])
    .filter((p) => p.is_published || isSuper)
    .map(mapProject);

  const { data: classes } = await supabase
    .from("classes")
    .select("year, label, donation_goal");
  const classMap = new Map((classes ?? []).map((c) => [c.year, c]));
  const myClassLabel = myYear ? classMap.get(myYear)?.label ?? null : null;

  // Aggregate per-class totals - visible to every approved member now.
  const { data: totalsData } = await supabase.rpc("class_donation_totals");
  const classCards = ((totalsData ?? []) as Totals[])
    .map((t) => ({
      year: t.class_year,
      label: t.label,
      total: Number(t.total_amount),
      goal: Number(t.goal),
      donors: Number(t.donor_count),
    }))
    .filter((t) => t.goal > 0 || t.total > 0)
    .sort((a, b) => b.total - a.total);

  const grandTotal = classCards.reduce((s, c) => s + c.total, 0);
  const activeClasses = classCards.filter((c) => c.total > 0).length;

  // Individual rows the caller may see (RLS-scoped).
  const { data: donations } = await supabase
    .from("donations")
    .select("id, donor_name, is_anonymous, class_year, amount, status, created_at")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (donations ?? []) as Donation[];

  const detailTitle = isSuper
    ? "Recent donations"
    : isClassAdmin
      ? `Class of ${adminYear} · donors`
      : "Your giving";

  return (
    <>
      <SiteHeader />
      <main>
        {/* ------------------------------------------------------------------
            0 · Admin quick-access — pinned at the very top so admins reach
            reports and management without scrolling the campaign. Regular
            members never render this bar.
        ------------------------------------------------------------------ */}
        {(isSuper || isClassAdmin) && (
          <div className="border-b border-gold-500/30 bg-emerald-900 text-cream">
            <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
                Administrator
              </span>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-[13px] text-cream/90">
                <a href="#ledger" className="transition-colors hover:text-gold-400">
                  {isSuper
                    ? "All class reports & donor ledger"
                    : `Class of ${adminYear} report`}{" "}
                  ↓
                </a>
                {isSuper && (
                  <Link href="/donations/manage" className="transition-colors hover:text-gold-400">
                    Manage projects →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            1 · Compact hero band — one promise, the button, the total raised.
            Deliberately short (a band, not a full-screen photo hero) so the
            page reads as a focused ask rather than a landing page.
        ------------------------------------------------------------------ */}
        <section className="relative overflow-hidden bg-emerald-900 text-cream">
          {/* Same layering as the landing hero: photo, then a green wash over
              it, then the diagonal texture, then the content on top. */}
          <div
            aria-hidden
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_IMG}')` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-emerald-900/85 via-emerald-900/75 to-emerald-900/90"
          />
          <div aria-hidden className="texture-diagonal absolute inset-0 opacity-60" />

          <div className="relative mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-x-10 gap-y-6 px-5 py-10 sm:px-8 sm:py-12">
            <div className="max-w-[560px] animate-fadeIn">
              <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.26em] text-gold-400">
                The giving campaign
              </p>
              <h1 className="font-display text-[clamp(28px,5vw,52px)] font-medium leading-[1.0]">
                Build the school that built you.
              </h1>
              <p className="mt-4 max-w-[480px] font-serif text-[16px] leading-relaxed text-cream/90">
                Every gift to Doherty becomes something real: a bursary, a
                laboratory, a library. And every naira is accounted for.
              </p>
              <a href="#give" className="btn btn-gold mt-6 px-8 py-4 text-[15px] shadow-lg">
                Make a gift
              </a>
            </div>

            {/* Total raised */}
            <div className="animate-fadeIn">
              {grandTotal > 0 ? (
                <div className="sm:text-right">
                  <div className="font-display text-[clamp(30px,4vw,44px)] font-semibold leading-none text-gold-400">
                    {ngn(grandTotal)}
                  </div>
                  <div className="mt-2 font-sans text-[11px] uppercase tracking-[0.16em] text-cream/75">
                    raised so far by {activeClasses}{" "}
                    {activeClasses === 1 ? "class" : "classes"}
                  </div>
                </div>
              ) : (
                <p className="max-w-[220px] font-sans text-[12px] uppercase tracking-[0.16em] text-cream/75 sm:text-right">
                  The campaign is just beginning. Be among the first names in the
                  book.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            2 · Where your gift goes — a compact row of project cards. The full
            story for each project lives on its own page ("Read the story").
        ------------------------------------------------------------------ */}
        {(projects.length > 0 || isSuper) && (
          <div id="causes" className="scroll-mt-24 bg-paper px-5 pt-12 sm:px-8 sm:pt-14">
            <div className="mx-auto max-w-[1100px]">
              <SupportedProjects projects={projects} canManage={isSuper} />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            3 · The give moment — the focal point of the page
        ------------------------------------------------------------------ */}
        <section
          id="give"
          className="texture-diagonal scroll-mt-24 bg-emerald-900 text-cream"
        >
          <div className="mx-auto max-w-[1100px] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
            <Reveal>
              <div className="mx-auto mb-8 max-w-[640px] text-center">
                <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.26em] text-gold-400">
                  Make your gift
                </p>
                <h2 className="font-display text-[clamp(28px,5vw,56px)] font-medium leading-[1.04]">
                  Put your name in the book.
                </h2>
                <p className="mt-5 font-serif text-[17px] leading-relaxed text-cream/85">
                  Pick an amount. It is credited to{" "}
                  {myClassLabel ?? "your graduating class"}, recorded in full,
                  and reported openly. Give proudly, or quietly.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="mx-auto max-w-[600px] border-2 border-gold-500/60 p-2 shadow-lg sm:p-3">
                <GiveForm
                  me={user.id}
                  userEmail={user.email ?? ""}
                  donorName={profile?.full_name ?? ""}
                  donorYear={myYear}
                  donorClassLabel={myClassLabel}
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            4 · For the record — class totals and the donation ledger
        ------------------------------------------------------------------ */}
        <div id="ledger" className="scroll-mt-24 border-t border-border bg-cream/60 px-5 py-12 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-[1100px]">
            {/* Fundraising by class - everyone sees aggregate; own class highlighted */}
            {classCards.length > 0 && (
              <section className="mb-16">
                <p className="mb-2 font-sans text-[11px] uppercase tracking-[0.24em] text-gold-500">
                  For the record
                </p>
                <h2 className="mb-6 border-b border-border pb-3 font-display text-[28px] font-medium text-emerald-900">
                  Fundraising by class
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {classCards.map((c) => {
                    const pct = c.goal > 0 ? Math.min(100, (c.total / c.goal) * 100) : 0;
                    const isMine = c.year === myYear;
                    const canDetail = isSuper || c.year === adminYear;
                    return (
                      <div
                        key={c.year}
                        className={`p-5 ${
                          isMine
                            ? "border-2 border-gold-500 bg-emerald-900 text-cream shadow-lg"
                            : "border border-border bg-cream"
                        }`}
                      >
                        <div className="mb-3 flex items-baseline justify-between">
                          <span
                            className={`font-display text-[22px] font-semibold ${
                              isMine ? "text-cream" : "text-emerald-900"
                            }`}
                          >
                            {c.label}
                          </span>
                          {isMine && (
                            <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-gold-400">
                              Your class
                            </span>
                          )}
                        </div>
                        <div
                          className={`mb-2.5 h-2.5 overflow-hidden rounded-full ${
                            isMine ? "bg-emerald-800" : "bg-cream-dark"
                          }`}
                        >
                          <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className={`font-sans text-[14px] ${isMine ? "text-cream/90" : "text-ink-soft"}`}>
                          <span className={`font-semibold ${isMine ? "text-gold-400" : "text-emerald-900"}`}>
                            {ngn(c.total)}
                          </span>
                          {c.goal > 0 && (
                            <span className={isMine ? "text-cream/60" : "text-ink-muted"}>
                              {" "}of {ngn(c.goal)}
                            </span>
                          )}
                          <span className={isMine ? "text-cream/60" : "text-ink-muted"}>
                            {" · "}{c.donors} {c.donors === 1 ? "gift" : "gifts"}
                          </span>
                        </p>
                        {canDetail && (
                          <Link
                            href={`/donations/report/${c.year}`}
                            className={`mt-2 inline-block font-sans text-[12px] hover:underline ${
                              isMine ? "text-gold-400" : "text-emerald-700"
                            }`}
                          >
                            View / print report →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 font-sans text-[12px] text-ink-muted">
                  Everyone sees each class&rsquo;s total. Individual donors are visible
                  only to a class&rsquo;s own administrator
                  {isSuper ? ", and to you across every class" : ""}.
                </p>
              </section>
            )}

            {/* Donations record */}
            <section>
              <h2 className="mb-5 font-display text-[26px] font-medium text-emerald-900">
                {detailTitle}
              </h2>
              <DonationTable rows={rows} showClass={isSuper} />
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function DonationTable({ rows, showClass }: { rows: Donation[]; showClass: boolean }) {
  if (rows.length === 0) {
    return (
      <p className="border border-border bg-cream px-4 py-10 text-center font-sans text-[14px] text-ink-muted">
        No donations recorded yet.
      </p>
    );
  }
  return (
    // overflow-x-auto (not hidden): on a phone the Amount/Date columns were
    // clipped with no way to reach them.
    <div className="-mx-5 overflow-x-auto border-y border-border sm:mx-0 sm:rounded-[2px] sm:border-x">
      <table className="w-full min-w-[560px] border-collapse bg-cream text-left">
        <thead>
          <tr className="bg-emerald-900 text-cream">
            <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Donor</th>
            {showClass && (
              <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Class</th>
            )}
            <th className="px-4 py-3 text-right font-sans text-[11px] uppercase tracking-[0.1em]">Amount</th>
            <th className="px-4 py-3 text-right font-sans text-[11px] uppercase tracking-[0.1em]">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-cream-dark">
              <td className="px-4 py-3 text-[14px] text-ink">
                {d.is_anonymous ? "Anonymous" : d.donor_name ?? "-"}
              </td>
              {showClass && (
                <td className="px-4 py-3 text-[14px] text-ink-soft">{d.class_year ?? "-"}</td>
              )}
              <td className="px-4 py-3 text-right text-[14px] font-semibold text-emerald-900">
                {ngn(Number(d.amount))}
              </td>
              <td className="px-4 py-3 text-right text-[13px] text-ink-muted">
                {shortDate(d.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
