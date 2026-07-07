"use client";

import { useMemo, useState } from "react";
import type { Alumni } from "@/lib/types";
import { AlumniCard, AlumniRow } from "./AlumniCard";
import { AlumniModal } from "./AlumniModal";

type View = "grid" | "list";

export function DirectoryClient({
  alumni,
  countries,
  years,
}: {
  alumni: Alumni[];
  countries: string[];
  years: number[];
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<Alumni | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alumni.filter((a) => {
      if (country && a.country !== country) return false;
      if (year && String(a.class_year) !== year) return false;
      if (q) {
        const haystack = [a.full_name, a.occupation, a.city, a.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [alumni, query, country, year]);

  return (
    <>
      {/* Search / filter bar */}
      <div className="sticky top-[93px] z-40 border-b border-border bg-cream px-8 py-6">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, profession, or place…"
            className="w-full rounded-[4px] border border-border bg-paper px-4 py-3.5 font-serif text-[16px] text-ink focus:border-emerald-700 focus:outline-none focus:ring-[3px] focus:ring-emerald-700/10"
          />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="min-w-[140px] rounded-[4px] border border-border bg-paper px-4 py-3.5 font-sans text-[13px] text-ink-soft focus:border-emerald-700 focus:outline-none"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                Class of &rsquo;{String(y % 100).padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="min-w-[140px] rounded-[4px] border border-border bg-paper px-4 py-3.5 font-sans text-[13px] text-ink-soft focus:border-emerald-700 focus:outline-none"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-[4px] border border-border">
            {(["grid", "list"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-3.5 font-sans text-[12px] uppercase tracking-[0.06em] transition-colors ${
                  view === v
                    ? "bg-emerald-900 text-cream"
                    : "bg-paper text-ink-muted hover:text-emerald-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-[1280px] px-8 py-12">
        <div className="mb-8 flex items-baseline justify-between border-b border-border pb-4">
          <h2 className="font-display text-[32px] font-medium text-emerald-900">
            Old Students Directory
          </h2>
          <span className="font-sans text-[13px] tracking-[0.04em] text-ink-muted">
            {filtered.length} {filtered.length === 1 ? "member" : "members"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-ink-muted">
            <h3 className="mb-2 font-display text-[28px] font-medium text-ink-soft">
              No old students found
            </h3>
            <p className="font-sans text-[14px]">
              Try a different search or clear the filters.
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-7">
            {filtered.map((a) => (
              <AlumniCard key={a.id} person={a} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2px] border border-border bg-cream">
            {filtered.map((a) => (
              <AlumniRow key={a.id} person={a} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <AlumniModal person={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
