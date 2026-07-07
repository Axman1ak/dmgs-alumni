import Link from "next/link";
import type { Project } from "@/lib/projects";
import { ngn } from "@/lib/format";
import { ProjectArt } from "./ProjectArt";
import { Reveal } from "./Reveal";

/**
 * One full-width, editorial image/text "spread" for a funded project.
 * Spreads alternate left/right down the page (magazine style) and always
 * point back to the give moment (`#give`) and the project's story page.
 */
export function ProjectSpread({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const flip = index % 2 === 1;

  return (
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      {/* Image side */}
      <Reveal className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
        <div className="relative">
          {/* Offset gold frame — yearbook plate feel */}
          <div
            aria-hidden
            className={`absolute top-4 hidden h-full w-full border-2 border-gold-500 md:block ${
              flip ? "-right-4" : "-left-4"
            }`}
          />
          <Link
            href={`/donations/projects/${project.slug}`}
            className="group relative block overflow-hidden shadow-lg"
          >
            <div className="aspect-[16/11] transition-transform duration-700 ease-out group-hover:scale-[1.03]">
              <ProjectArt project={project} className="h-full w-full" />
            </div>
            <span className="absolute left-5 top-5 bg-emerald-900/90 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-400 backdrop-blur">
              {project.tag}
            </span>
          </Link>
        </div>
      </Reveal>

      {/* Story side */}
      <Reveal delay={140} className={`lg:col-span-5 ${flip ? "lg:order-1" : ""}`}>
        <div className="font-display text-[56px] font-semibold leading-none text-gold-500/30">
          {String(index + 1).padStart(2, "0")}
        </div>
        <h3 className="mt-2 font-display text-[clamp(30px,3.6vw,42px)] font-medium leading-[1.05] text-emerald-900">
          <Link
            href={`/donations/projects/${project.slug}`}
            className="transition-colors hover:text-emerald-700"
          >
            {project.title}
          </Link>
        </h3>
        {project.tagline && (
          <p className="mt-4 font-serif text-[17px] leading-relaxed text-ink-soft">
            {project.tagline}
          </p>
        )}
        {project.goal > 0 && (
          <p className="mt-5 font-sans text-[12px] uppercase tracking-[0.16em] text-ink-muted">
            Goal{" "}
            <span className="font-semibold text-emerald-900">{ngn(project.goal)}</span>
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
          <a href="#give" className="btn btn-gold">
            Support this project
          </a>
          <Link
            href={`/donations/projects/${project.slug}`}
            className="font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-emerald-700 transition-colors hover:text-emerald-900 hover:underline"
          >
            Read the story →
          </Link>
        </div>
      </Reveal>
    </article>
  );
}
