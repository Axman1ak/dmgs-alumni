import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GiveForm } from "@/components/donations/GiveForm";
import { SupportedProjects } from "@/components/donations/SupportedProjects";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";
import { ngn, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

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
        {/* Hero */}
        <section className="texture-diagonal bg-emerald-900 px-8 pb-16 pt-16 text-cream">
          <div className="mx-auto grid max-w-[1100px] items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.24em] text-gold-400">
                Give back
              </p>
              <h1 className="font-display text-[clamp(42px,6vw,64px)] font-medium leading-[1.02]">
                Build the school that built you.
              </h1>
              <p className="mt-4 max-w-[500px] font-serif text-[17px] leading-relaxed text-cream/85">
                A bursary that keeps a bright student in class. A laboratory where
                they run the experiment instead of reading it. Every gift to
                Doherty becomes something real, and every naira is accounted for.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#give" className="btn btn-gold px-8 py-4">
                  Make a gift
                </a>
                <a
                  href="#causes"
                  className="link-underline font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-cream"
                >
                  See what it funds &rarr;
                </a>
              </div>
            </div>
            <div className="lg:justify-self-end lg:border-l-2 lg:border-gold-500 lg:pl-8">
              <div className="font-display text-[clamp(42px,7vw,58px)] font-semibold leading-none text-gold-400">
                {ngn(grandTotal)}
              </div>
              <div className="mt-2 font-sans text-[12px] uppercase tracking-[0.14em] text-cream/70">
                Raised so far by {activeClasses} {activeClasses === 1 ? "class" : "classes"}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1100px] px-8 py-16">
          {/* Storytelling — what gifts fund */}
          <div id="causes" className="scroll-mt-24">
            <SupportedProjects projects={projects} canManage={isSuper} />
          </div>

          {/* Make your gift — the clear, prominent donate step */}
          <section id="give" className="mb-16 scroll-mt-24">
            <div className="mx-auto mb-8 max-w-[600px] text-center">
              <p className="mb-2 font-sans text-[11px] uppercase tracking-[0.2em] text-gold-500">
                Make your gift
              </p>
              <h2 className="mb-3 font-display text-[36px] font-medium text-emerald-900">
                It takes two taps
              </h2>
              <p className="font-serif text-[16px] leading-relaxed text-ink-soft">
                Pick an amount. It&rsquo;s credited to your class and recorded in
                full. Give proudly, or anonymously.
              </p>
            </div>
            <div className="mx-auto max-w-[560px]">
              <GiveForm
                me={user.id}
                userEmail={user.email ?? ""}
                donorName={profile?.full_name ?? ""}
                donorYear={myYear}
                donorClassLabel={myClassLabel}
              />
            </div>
          </section>

          {/* Fundraising by class - everyone sees aggregate; own class highlighted */}
          {classCards.length > 0 && (
            <section className="mb-14">
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
    <div className="overflow-hidden rounded-[2px] border border-border">
      <table className="w-full border-collapse bg-cream text-left">
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
