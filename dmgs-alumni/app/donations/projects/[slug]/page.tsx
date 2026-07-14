import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProjectArt } from "@/components/donations/ProjectArt";
import { BudgetBreakdown } from "@/components/donations/BudgetBreakdown";
import { Reveal } from "@/components/donations/Reveal";
import { mapProject } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import { ngn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!row) notFound();
  const project = mapProject(row);

  const { data: otherRows } = await supabase
    .from("projects")
    .select("*")
    .neq("slug", params.slug)
    .order("sort_order");
  const others = (otherRows ?? []).map(mapProject);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Cinematic hero */}
        <section className="relative h-[42vh] min-h-[300px] sm:h-[62vh] sm:min-h-[420px] w-full overflow-hidden">
          <ProjectArt project={project} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/50 to-emerald-900/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1100px] px-5 sm:px-8 pb-12">
            <div className="animate-fadeIn">
              <Link
                href="/donations"
                className="mb-4 inline-block font-sans text-[12px] uppercase tracking-[0.14em] text-cream/80 hover:text-gold-400"
              >
                ← All giving
              </Link>
              <p className="mb-2 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">
                {project.tag}
              </p>
              <h1 className="max-w-[820px] font-display text-[clamp(28px,6vw,64px)] font-medium leading-[1.02] text-cream">
                {project.title}
              </h1>
              <p className="mt-4 max-w-[560px] font-serif text-[19px] italic text-cream/85">
                {project.tagline}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          {/* The idea */}
          <section className="grid gap-10 py-16 lg:grid-cols-[1fr_320px]">
            <div>
              <Reveal>
                <h2 className="mb-6 font-display text-[32px] font-medium text-emerald-900">
                  The idea
                </h2>
              </Reveal>
              <div className="space-y-5">
                {project.idea.map((para, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <p className="font-serif text-[18px] leading-relaxed text-ink-soft">
                      {para}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={120}>
              <aside className="border border-border bg-cream p-6 lg:sticky lg:top-28">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                  Funding goal
                </p>
                <p className="mt-1 font-display text-[34px] font-semibold text-emerald-900">
                  {ngn(project.goal)}
                </p>
                <p className="mt-4 border-t border-border pt-4 font-serif text-[15px] italic leading-relaxed text-ink-soft">
                  {project.impact}
                </p>
                <Link href="/donations" className="btn btn-gold mt-6 w-full justify-center">
                  Support this project
                </Link>
              </aside>
            </Reveal>
          </section>

          {/* Transparency */}
          <section className="border-t border-border py-16">
            <Reveal>
              <p className="mb-2 font-sans text-[11px] uppercase tracking-[0.2em] text-gold-500">
                Full transparency
              </p>
              <h2 className="mb-8 font-display text-[32px] font-medium text-emerald-900">
                Where every naira goes
              </h2>
            </Reveal>
            <div className="max-w-[760px]">
              <BudgetBreakdown lines={project.budget} goal={project.goal} />
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-border py-16 text-center">
            <Reveal>
              <h2 className="mx-auto max-w-[600px] font-display text-[36px] font-medium leading-tight text-emerald-900">
                Be part of {project.title.toLowerCase()}
              </h2>
              <p className="mx-auto mt-3 max-w-[460px] font-serif text-[17px] text-ink-soft">
                Every gift is credited to your class and recorded in full.
              </p>
              <Link href="/donations" className="btn btn-primary mt-7 px-5 sm:px-8 py-4">
                Make a gift
              </Link>
            </Reveal>
          </section>

          {/* Other projects */}
          <section className="border-t border-border py-14">
            <h3 className="mb-6 font-display text-[24px] font-medium text-emerald-900">
              More ways to give
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {others.map((p) => (
                <Link
                  key={p.slug}
                  href={`/donations/projects/${p.slug}`}
                  className="group flex items-center gap-5 overflow-hidden border border-border bg-cream transition-all hover:border-emerald-700 hover:shadow-soft"
                >
                  <div className="h-24 w-32 shrink-0 overflow-hidden">
                    <ProjectArt project={p} className="h-full w-full" />
                  </div>
                  <div className="py-3 pr-4">
                    <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-gold-500">
                      {p.tag}
                    </p>
                    <p className="font-display text-[20px] font-semibold text-emerald-900">
                      {p.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
