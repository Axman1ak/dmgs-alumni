import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProjectCarousel } from "@/components/donations/ProjectCarousel";
import { DuesCard } from "@/components/donations/DuesCard";
import { AnimatedTotal } from "@/components/donations/AnimatedTotal";
import { Reveal } from "@/components/donations/Reveal";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

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

  // My graduating class + label.
  const { data: myAlum } = await supabase
    .from("alumni")
    .select("class_year")
    .eq("profile_id", user.id)
    .maybeSingle();
  const myYear = myAlum?.class_year ?? profile?.class_year ?? null;
  let classLabel: string | null = null;
  if (myYear) {
    const { data: cls } = await supabase
      .from("classes")
      .select("label")
      .eq("year", myYear)
      .maybeSingle();
    classLabel = cls?.label ?? null;
  }

  // Projects + per-project money raised.
  const { data: projRows } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order");
  const projects = (projRows ?? [])
    .filter((p) => p.is_published || isSuper)
    .map(mapProject);

  const { data: totalsRows } = await supabase.rpc("project_totals");
  const totalById = new Map<string, number>(
    (totalsRows ?? []).map((t: { project_id: string; total: number | string }) => [
      t.project_id,
      Number(t.total),
    ]),
  );
  const raised: Record<string, number> = {};
  projects.forEach((p) => {
    raised[p.slug] = totalById.get(p.id) ?? 0;
  });

  // Dues: amount, whether I've paid this year, class participation.
  const { data: duesRow } = await supabase
    .from("annual_dues")
    .select("amount")
    .eq("year", year)
    .maybeSingle();
  const duesAmount = duesRow ? Number(duesRow.amount) : null;

  const { data: myDues } = await supabase
    .from("donations")
    .select("id")
    .eq("kind", "dues")
    .eq("donor_profile_id", user.id)
    .eq("period_year", year)
    .eq("status", "success")
    .maybeSingle();
  const paidThisYear = Boolean(myDues);

  const { data: part } = await supabase.rpc("class_dues_participation", { p_year: year });
  const participation = (part?.[0] ?? { member_count: 0, paid_count: 0 }) as {
    member_count: number;
    paid_count: number;
  };

  // My total giving (own successful rows are readable under RLS).
  const { data: myGifts } = await supabase
    .from("donations")
    .select("amount")
    .eq("donor_profile_id", user.id)
    .eq("status", "success");
  const myTotal = (myGifts ?? []).reduce((s, g) => s + Number(g.amount), 0);
  const myCount = myGifts?.length ?? 0;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Intro + your total */}
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-end justify-between gap-6 px-5 pt-10 sm:px-8">
          <Reveal>
            <div className="max-w-[720px]">
              <p className="font-sans text-[12px] uppercase tracking-[0.26em] text-gold-500">
                Give back
              </p>
              <h1 className="mt-2.5 font-display text-[clamp(28px,4.6vw,46px)] font-medium leading-[1.05] text-emerald-900">
                Support Doherty, and keep your class alive.
              </h1>
            </div>
          </Reveal>
          {myTotal > 0 && (
            <div className="border-r-[3px] border-gold-500 pr-4 text-right">
              <div className="font-display text-[clamp(30px,4vw,42px)] font-semibold leading-none text-emerald-900">
                <AnimatedTotal value={myTotal} />
              </div>
              <div className="mt-1.5 font-sans text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                Your giving · {myCount} {myCount === 1 ? "gift" : "gifts"}
              </div>
            </div>
          )}
        </div>

        {/* 1 · Projects */}
        <section className="mx-auto max-w-[1160px] px-5 pt-9 sm:px-8">
          <Reveal>
            <div className="mb-5 flex flex-wrap items-baseline gap-3.5">
              <span className="flex h-6 w-6 items-center justify-center bg-gold-500 font-sans text-[12px] font-bold text-emerald-900">
                1
              </span>
              <h2 className="font-display text-[26px] font-semibold text-emerald-900">
                Support a project
              </h2>
              {isSuper && (
                <Link
                  href="/donations/manage"
                  className="ml-auto font-sans text-[13px] font-medium text-emerald-700 hover:underline"
                >
                  Manage projects →
                </Link>
              )}
            </div>
          </Reveal>
          {projects.length > 0 ? (
            <Reveal delay={80}>
              <ProjectCarousel projects={projects} raised={raised} />
            </Reveal>
          ) : (
            <p className="border border-border bg-cream px-4 py-12 text-center font-sans text-[14px] text-ink-muted">
              No projects are open right now. Please check back soon.
            </p>
          )}
        </section>

        {/* 2 · Annual dues */}
        <section className="mx-auto max-w-[1160px] px-5 pb-16 pt-12 sm:px-8">
          <Reveal>
            <div className="mb-5 flex items-baseline gap-3.5">
              <span className="flex h-6 w-6 items-center justify-center bg-gold-500 font-sans text-[12px] font-bold text-emerald-900">
                2
              </span>
              <h2 className="font-display text-[26px] font-semibold text-emerald-900">
                Your annual dues
              </h2>
            </div>
          </Reveal>
          {!myYear ? (
            <div className="border border-border bg-cream p-6">
              <p className="text-[15px] text-ink-soft">
                Your graduating class isn&rsquo;t set yet, so we can&rsquo;t attach your
                dues to a class. Ask an administrator to set it.
              </p>
            </div>
          ) : (
            <Reveal delay={80}>
              <DuesCard
                userEmail={user.email ?? ""}
                year={year}
                amount={duesAmount}
                classLabel={classLabel}
                paid={paidThisYear}
                memberCount={participation.member_count}
                paidCount={participation.paid_count}
              />
            </Reveal>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
