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
  const adminYear = profile?.admin_of_year ?? null;

  // Default class for the give form: the donor's own claimed record / profile.
  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;

  const { data: classes } = await supabase
    .from("classes")
    .select("year, label, donation_goal")
    .order("year", { ascending: false });

  // Aggregate per-class totals (admins only — RPC enforces this too).
  let totals: Totals[] = [];
  if (isSuper || isClassAdmin) {
    const { data } = await supabase.rpc("class_donation_totals");
    totals = (data ?? []) as Totals[];
  }

  // Detail rows visible to the caller (RLS decides what returns).
  const { data: donations } = await supabase
    .from("donations")
    .select("id, donor_name, is_anonymous, class_year, amount, status, created_at")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (donations ?? []) as Donation[];

  const withGoals = totals
    .map((t) => ({
      ...t,
      total: Number(t.total_amount),
      goal: Number(t.goal),
      donors: Number(t.donor_count),
    }))
    .filter((t) => t.goal > 0 || t.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="texture-diagonal bg-emerald-900 px-8 pb-12 pt-16 text-cream">
          <div className="mx-auto max-w-[1280px]">
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

        <div className="mx-auto grid max-w-[1280px] gap-10 px-8 py-12 lg:grid-cols-[380px_1fr]">
          {/* Give form */}
          <div>
            <GiveForm
              me={user.id}
              userEmail={user.email ?? ""}
              classes={(classes ?? []).map((c) => ({ year: c.year, label: c.label }))}
              defaultYear={myYear}
            />
          </div>

          {/* Right column */}
          <div>
            {(isSuper || isClassAdmin) && withGoals.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-5 border-b border-border pb-3 font-display text-[26px] font-medium text-emerald-900">
                  Class fundraising
                </h2>
                <div className="space-y-5">
                  {withGoals.map((t) => {
                    const pct = t.goal > 0 ? Math.min(100, (t.total / t.goal) * 100) : 0;
                    const canSeeDetail = isSuper || t.class_year === adminYear;
                    return (
                      <div key={t.class_year}>
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="font-display text-[18px] font-semibold text-emerald-900">
                            {t.label}
                          </span>
                          <span className="font-sans text-[13px] text-ink-muted">
                            {ngn(t.total)}
                            {t.goal > 0 && ` of ${ngn(t.goal)}`} · {t.donors}{" "}
                            {t.donors === 1 ? "donor" : "donors"}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-cream-dark">
                          <div
                            className="h-full rounded-full bg-gold-500"
                            style={{ width: `${t.goal > 0 ? pct : 0}%` }}
                          />
                        </div>
                        {canSeeDetail && (
                          <Link
                            href={`/donations/report/${t.class_year}`}
                            className="mt-1.5 inline-block font-sans text-[12px] text-emerald-700 hover:underline"
                          >
                            View class report →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isClassAdmin && (
                  <p className="mt-4 font-sans text-[12px] text-ink-muted">
                    You see individual donations only for your class ({adminYear}).
                    Other classes show aggregate totals only.
                  </p>
                )}
              </section>
            )}

            {/* Detail table */}
            <section>
              <h2 className="mb-5 border-b border-border pb-3 font-display text-[26px] font-medium text-emerald-900">
                {isSuper
                  ? "All donations"
                  : isClassAdmin
                    ? `Donations — Class of ${adminYear}`
                    : "Your giving"}
              </h2>

              {rows.length === 0 ? (
                <p className="py-10 text-center font-sans text-[14px] text-ink-muted">
                  {isSuper || isClassAdmin
                    ? "No donations recorded yet."
                    : "You haven't made a donation yet. Your gifts will appear here."}
                </p>
              ) : (
                <div className="overflow-hidden rounded-[2px] border border-border">
                  <table className="w-full border-collapse bg-cream text-left">
                    <thead>
                      <tr className="bg-emerald-900 text-cream">
                        <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Donor</th>
                        <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Class</th>
                        <th className="px-4 py-3 text-right font-sans text-[11px] uppercase tracking-[0.1em]">Amount</th>
                        <th className="px-4 py-3 font-sans text-[11px] uppercase tracking-[0.1em]">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => (
                        <tr key={d.id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-3 text-[14px] text-ink">
                            {d.is_anonymous ? "Anonymous" : d.donor_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[14px] text-ink-soft">
                            {d.class_year ?? "General"}
                          </td>
                          <td className="px-4 py-3 text-right text-[14px] font-semibold text-emerald-900">
                            {ngn(d.amount)}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-ink-muted">
                            {shortDate(d.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
