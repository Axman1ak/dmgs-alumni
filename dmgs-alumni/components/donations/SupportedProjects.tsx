import Link from "next/link";
import { PROJECTS } from "@/lib/projects";
import { ProjectArt } from "./ProjectArt";
import { ngn } from "@/lib/format";
import { Reveal } from "./Reveal";

/**
 * "Where your gift goes" — clickable project cards leading to full,
 * transparent project pages. Placeholder content the super admin can edit
 * in lib/projects.ts (and drop real photos into /public/projects/).
 */
export function SupportedProjects() {
  return (
    <section className="mb-16">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display text-[28px] font-medium text-emerald-900">
          Where your gift goes
        </h2>
        <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-gold-500">
          Current priorities
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.slug} delay={i * 90}>
            <Link
              href={`/donations/projects/${p.slug}`}
              className="group flex h-full flex-col overflow-hidden border border-border bg-cream shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
            >
              <div className="relative h-44 overflow-hidden">
                <div className="h-full transition-transform duration-500 group-hover:scale-105">
                  <ProjectArt project={p} className="h-full w-full" />
                </div>
                <span className="absolute left-4 top-4 bg-emerald-900/90 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-400 backdrop-blur">
                  {p.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-2 font-display text-[24px] font-semibold leading-tight text-emerald-900">
                  {p.title}
                </h3>
                <p className="mb-4 flex-1 font-serif text-[15px] leading-relaxed text-ink-soft">
                  {p.tagline}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-sans text-[12px] text-ink-muted">
                    Goal{" "}
                    <span className="font-semibold text-emerald-900">{ngn(p.goal)}</span>
                  </span>
                  <span className="font-sans text-[12px] font-semibold text-gold-500 transition-transform group-hover:translate-x-1">
                    Read the story →
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
