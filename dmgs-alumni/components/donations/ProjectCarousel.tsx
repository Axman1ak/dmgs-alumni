"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import { ProjectArt } from "./ProjectArt";
import { ngn } from "@/lib/format";

/**
 * One large featured project at a time, with arrows and dots. Auto-advances,
 * pauses is not needed for this scale. The progress bar animates on each change.
 */
export function ProjectCarousel({
  projects,
  raised,
}: {
  projects: Project[];
  raised: Record<string, number>;
}) {
  const [i, setI] = useState(0);
  const [barKey, setBarKey] = useState(0);
  const n = projects.length;

  const go = (d: number) => setI((p) => (p + d + n) % n);
  const jump = (k: number) => setI(k);

  // Re-trigger the bar animation whenever the slide changes.
  useEffect(() => {
    setBarKey((k) => k + 1);
  }, [i]);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 6500);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;
  const p = projects[i];
  const got = raised[p.slug] ?? 0;
  const pct = p.goal > 0 ? Math.min(100, Math.round((got / p.goal) * 100)) : 0;

  return (
    <div className="relative h-[400px] overflow-hidden border border-border bg-emerald-900 sm:h-[460px]">
      {projects.map((proj, k) => (
        <div
          key={proj.slug}
          className={`absolute inset-0 transition-opacity duration-700 ${
            k === i ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="kenburns absolute inset-0">
            <ProjectArt project={proj} className="h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/45 to-emerald-900/10" />
        </div>
      ))}

      {/* Content of the active slide */}
      <div className="absolute inset-x-0 bottom-0 p-6 text-cream sm:p-9">
        <span className="inline-block bg-gold-500 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-900">
          {p.tag} · {i + 1} of {n}
        </span>
        <h3 className="mt-3 max-w-[640px] font-display text-[clamp(24px,3.4vw,38px)] font-medium leading-[1.05]">
          {p.title}
        </h3>
        <div className="mt-4 h-[7px] max-w-[420px] overflow-hidden bg-cream/20">
          <div
            key={barKey}
            className="h-full bg-gold-500"
            style={{ width: `${pct}%`, transition: "width 1.2s cubic-bezier(.2,.7,.2,1)" }}
          />
        </div>
        <p className="mt-2 font-sans text-[13px] text-cream/85">
          <span className="font-semibold text-gold-400">{ngn(got)}</span>
          {p.goal > 0 && <> of {ngn(p.goal)}</>}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/donations/projects/${p.slug}#give`}
            className="btn btn-gold px-6 py-3.5"
          >
            Give to this project →
          </Link>
          <Link
            href={`/donations/projects/${p.slug}`}
            className="btn border-[1.5px] border-cream/40 bg-cream/10 px-6 py-3.5 text-cream hover:border-gold-400 hover:text-gold-400"
          >
            Read the story
          </Link>
        </div>
      </div>

      {n > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous project"
            className="absolute left-3.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-cream/30 bg-emerald-900/50 text-[20px] text-cream backdrop-blur transition-colors hover:bg-gold-500 hover:text-emerald-900"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next project"
            className="absolute right-3.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-cream/30 bg-emerald-900/50 text-[20px] text-cream backdrop-blur transition-colors hover:bg-gold-500 hover:text-emerald-900"
          >
            ›
          </button>
          <div className="absolute right-8 top-6 z-10 flex gap-2">
            {projects.map((proj, k) => (
              <button
                key={proj.slug}
                onClick={() => jump(k)}
                aria-label={`Go to project ${k + 1}`}
                className={`h-2.5 w-2.5 ${k === i ? "bg-gold-500" : "bg-cream/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
