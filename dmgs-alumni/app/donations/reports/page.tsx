import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DuesAmountForm } from "@/components/donations/DuesAmountForm";
import { createClient } from "@/lib/supabase/server";
import { ngn, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Totals = {
  class_year: number;
  label: string;
  project_total: number | string;
  dues_total: number | string;
  total_amount: number | string;
  donor_count: number | string;
  goal: number | string;
};

type Ledger = {
  id: string;
  donor_name: string | null;
  is_anonymous: boolean;
  class_year: number | null;
  kind: string;
  amount: number;
  status: string;
  created_at: string;
};

export default async function ReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, class_year, admin_of_year")
    .eq("id", user.id)
    .single();
  const isSuper = profile?.role === "super_admin";
  const isClassAdmin = profile?.role === "class_admin";
  // Reports are an admin surface — members never land here.
  if (!isSuper && !isClassAdmin) redirect("/donations");
  const adminYear = profile?.admin_of_year ?? null;

  const year = new Date().getFullYear();
  const { data: duesRow } = await supabase
    .from("annual_dues")
    .select("amount")
    .eq("year", year)
    .maybeSingle();
  const duesAmount = duesRow ? Number(duesRow.amount) : null;

  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;

  const { data: totalsData } = await supabase.rpc("class_donation_totals");
  const classCards = ((totalsData ?? []) as Totals[])
    .map((t) => ({
      year: t.class_year,
      label: t.label,
      projects: Number(t.project_total),
      dues: Number(t.dues_total),
      total: Number(t.total_amount),
      goal: Number(t.goal),
      donors: Number(t.donor_count),
    }))
    .filter((t) => t.goal > 0 || t.total > 0)
    .sort((a, b) => b.total - a.total);

  const { data: donations } = await supabase
    .from("donations")
    .select("id, donor_name, is_anonymous, class_year, kind, amount, status, created_at")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (donations ?? []) as Ledger[];

  const detailTitle = isSuper
    ? "All payments"
    : isClassAdmin
      ? `Class of ${adminYear} · payments`
      : "Your payments";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8">
        <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.24em] text-gold-500">
          For the record
        </p>
        <h1 className="mb-8 font-display text-[clamp(28px,5vw,40px)] font-medium text-emerald-900">
          Reports &amp; history
        </h1>

        {/* Super admin: set the annual dues amount */}
        {isSuper && (
          <div className="mb-10">
            <DuesAmountForm year={year} amount={duesAmount} />
          </div>
        )}

        {/* Fundraising by class */}
        {classCards.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 border-b border-border pb-3 font-display text-[24px] font-medium text-emerald-900">
              By class
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {classCards.map((c) => {
                const pct = c.goal > 0 ? Math.min(100, (c.projects / c.goal) * 100) : 0;
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
                    {c.goal > 0 && (
                      <div
                        className={`mb-3 h-2 overflow-hidden rounded-full ${
                          isMine ? "bg-emerald-800" : "bg-cream-dark"
                        }`}
                      >
                        <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    <dl className="space-y-1.5 font-sans text-[13px]">
                      <div className="flex justify-between">
                        <dt className={isMine ? "text-cream/70" : "text-ink-muted"}>Projects</dt>
                        <dd className={`font-semibold ${isMine ? "text-gold-400" : "text-emerald-900"}`}>
                          {ngn(c.projects)}
                          {c.goal > 0 && (
                            <span className={`font-normal ${isMine ? "text-cream/50" : "text-ink-muted"}`}>
                              {" "}/ {ngn(c.goal)}
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className={isMine ? "text-cream/70" : "text-ink-muted"}>Dues</dt>
                        <dd className={`font-semibold ${isMine ? "text-cream" : "text-emerald-900"}`}>
                          {ngn(c.dues)}
                        </dd>
                      </div>
                    </dl>
                    {canDetail && (
                      <Link
                        href={`/donations/report/${c.year}`}
                        className={`mt-3 inline-block font-sans text-[12px] hover:underline ${
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
              Everyone sees each class&rsquo;s totals. Individual payers are visible
              only to a class&rsquo;s own administrator
              {isSuper ? ", and to you across every class" : ""}.
            </p>
          </section>
        )}

        {/* Payment ledger */}
        <section>
          <h2 className="mb-5 font-display text-[24px] font-medium text-emerald-900">
            {detailTitle}
          </h2>
          <LedgerTable rows={rows} showClass={isSuper} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function LedgerTable({ rows, showClass }: { rows: Ledger[]; showClass: boolean }) {
  if (rows.length === 0) {
    return (
      <p className="border border-border bg-cream px-4 py-10 text-center font-sans text-[14px] text-ink-muted">
        No payments recorded yet.
      </p>
    );
  }
  return (
    <div className="-mx-5 overflow-x-auto border-y border-border sm:mx-0 sm:rounded-[2px] sm:border-x">
      <table className="w-full min-w-[620px] border-collapse bg-cream text-left">
        <thead>
          <tr className="bg-emerald-900 text-cream">
            <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Name</th>
            <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Type</th>
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
              <td className="px-4 py-3 text-[13px] text-ink-soft">
                {d.kind === "dues" ? "Dues" : "Project"}
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
