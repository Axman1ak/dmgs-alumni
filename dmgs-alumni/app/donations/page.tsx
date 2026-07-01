import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GiveForm } from "@/components/donations/GiveForm";
import { createClient } from "@/lib/supabase/server";
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
    .select("role, class_year, admin_of_year")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "member";
  const isSuper = role === "super_admin";
  const isClassAdmin = role === "class_admin";
  const isAdmin = isSuper || isClassAdmin;

  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;

  const { data: classes } = await supabase
    .from("classes")
    .select("year, label, donation_goal");
  const classMap = new Map((classes ?? []).map((c) => [c.year, c]));
  const myClassLabel = myYear ? classMap.get(myYear)?.label ?? null : null;

  let totals: Totals[] = [];
  if (isAdmin) {
    const { data } = await supabase.rpc("class_donation_totals");
    totals = (data ?? []) as Totals[];
  }

  const { data: donations } = await supabase
    .from("donations")
    .select("id, donor_name, is_anonymous, class_year, amount, status, created_at")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (donations ?? []) as Donation[];

  const classCards = totals
    .map((t) => ({
      year: t.class_year,
      label: t.label,
      total: Number(t.total_amount),
      goal: Number(t.goal),
      donors: Number(t.donor_count),
    }))
    .filter((t) => t.goal > 0 || t.total > 0)
    .sort((a, b) => b.total - a.total);

  const grandTotal = isAdmin
    ? classCards.reduce((s, c) => s + c.total, 0)
    : rows.reduce((s, d) => s + Number(d.amount), 0);
  const totalGifts = isAdmin
    ? classCards.reduce((s, c) => s + c.donors, 0)
    : rows.length;

  // Member's own class figures.
  const myClassGoal = myYear ? Number(classMap.get(myYear)?.donation_goal ?? 0) : 0;
  const myClassRows = rows.filter((d) => d.class_year === myYear);
  const myClassRaised = myClassRows.reduce((s, d) => s + Number(d.amount), 0);
  const myClassPct = myClassGoal > 0 ? Math.min(100, (myClassRaised / myClassGoal) * 100) : 0;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="texture-diagonal bg-emerald-900 px-8 pb-12 pt-16 text-cream">
          <div className="mx-auto max-w-[1200px]">
            <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.24em] text-gold-400">
              Give back
            </p>
            <h1 className="font-display text-[54px] font-medium leading-none">Giving</h1>
            <p className="mt-3 max-w-[520px] font-serif text-[17px] italic opacity-85">
              Support Doherty Memorial and the class projects that carry its name
              forward.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-8 py-12">
          {isAdmin ? (
            <>
              {/* Stat band */}
              <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Stat label={isSuper ? "Raised, all classes" : "Raised, your class"} value={ngn(grandTotal)} />
                <Stat label="Total gifts" value={String(totalGifts)} />
                <Stat label="Classes giving" value={String(classCards.filter((c) => c.total > 0).length)} />
              </div>

              {/* Class fundraising grid */}
              {classCards.length > 0 && (
                <section className="mb-12">
                  <h2 className="mb-5 font-display text-[26px] font-medium text-emerald-900">
                    Fundraising by class
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {classCards.map((c) => {
                      const pct = c.goal > 0 ? Math.min(100, (c.total / c.goal) * 100) : 0;
                      const canDetail = isSuper || c.year === profile?.admin_of_year;
                      return (
                        <div key={c.year} className="border border-border bg-cream p-5">
                          <div className="mb-2 flex items-baseline justify-between">
                            <span className="font-display text-[20px] font-semibold text-emerald-900">
                              {c.label}
                            </span>
                            <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                              {c.donors} {c.donors === 1 ? "gift" : "gifts"}
                            </span>
                          </div>
                          <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-cream-dark">
                            <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="font-sans text-[13px] text-ink-soft">
                            <span className="font-semibold text-emerald-900">{ngn(c.total)}</span>
                            {c.goal > 0 && <span className="text-ink-muted"> of {ngn(c.goal)}</span>}
                          </p>
                          {canDetail && (
                            <Link
                              href={`/donations/report/${c.year}`}
                              className="mt-2 inline-block font-sans text-[12px] text-emerald-700 hover:underline"
                            >
                              View / print report →
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {isClassAdmin && (
                    <p className="mt-4 font-sans text-[12px] text-ink-muted">
                      You see individual donors only for your class. Other classes
                      show totals only.
                    </p>
                  )}
                </section>
              )}

              {/* Recent donations + give card */}
              <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                <section>
                  <h2 className="mb-5 font-display text-[26px] font-medium text-emerald-900">
                    {isSuper ? "Recent donations" : `Class of ${profile?.admin_of_year} donations`}
                  </h2>
                  <DonationTable rows={rows} showClass={isSuper} />
                </section>
                <aside className="lg:pt-1">
                  <GiveForm
                    me={user.id}
                    userEmail={user.email ?? ""}
                    donorYear={myYear}
                    donorClassLabel={myClassLabel}
                  />
                </aside>
              </div>
            </>
          ) : (
            /* Member view */
            <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
              <div>
                <GiveForm
                  me={user.id}
                  userEmail={user.email ?? ""}
                  donorYear={myYear}
                  donorClassLabel={myClassLabel}
                />
              </div>
              <div>
                {myYear ? (
                  <>
                    <section className="mb-10">
                      <h2 className="mb-4 font-display text-[26px] font-medium text-emerald-900">
                        {myClassLabel ?? `Class of ${myYear}`}
                      </h2>
                      <div className="border border-border bg-cream p-6">
                        <div className="mb-2 h-3 overflow-hidden rounded-full bg-cream-dark">
                          <div className="h-full rounded-full bg-gold-500" style={{ width: `${myClassPct}%` }} />
                        </div>
                        <p className="font-sans text-[14px] text-ink-soft">
                          <span className="font-semibold text-emerald-900">{ngn(myClassRaised)}</span>
                          {myClassGoal > 0 && <span className="text-ink-muted"> of {ngn(myClassGoal)} goal</span>}
                          {" · "}
                          {myClassRows.length} {myClassRows.length === 1 ? "gift" : "gifts"}
                        </p>
                      </div>
                    </section>
                    <section>
                      <h2 className="mb-4 font-display text-[26px] font-medium text-emerald-900">
                        Your class&rsquo;s donations
                      </h2>
                      <DonationTable rows={myClassRows} showClass={false} />
                    </section>
                  </>
                ) : (
                  <div className="border border-border bg-cream p-8 text-center">
                    <h3 className="mb-2 font-display text-[22px] text-emerald-900">
                      Set your graduating year
                    </h3>
                    <p className="text-[14px] text-ink-soft">
                      Claim your directory listing so we can show your class&rsquo;s giving.
                    </p>
                    <Link href="/account" className="btn btn-outline mt-5">
                      Go to my profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-cream p-5">
      <div className="font-display text-[30px] font-semibold text-emerald-900">{value}</div>
      <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </div>
    </div>
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
                {d.is_anonymous ? "Anonymous" : d.donor_name ?? "—"}
              </td>
              {showClass && (
                <td className="px-4 py-3 text-[14px] text-ink-soft">{d.class_year ?? "—"}</td>
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
