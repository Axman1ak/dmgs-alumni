import Image from "next/image";
import type { Alumni } from "@/lib/types";
import { initialsOf, classBadge, orPlaceholder } from "@/lib/types";

/** Yearbook-style grid card with framed portrait + class-year badge. */
export function AlumniCard({
  person,
  onOpen,
}: {
  person: Alumni;
  onOpen: (a: Alumni) => void;
}) {
  const badge = classBadge(person.class_year);
  return (
    <button
      onClick={() => onOpen(person)}
      className="group relative overflow-hidden rounded-[2px] border border-border bg-cream text-left transition-all duration-200 hover:-translate-y-1 hover:border-emerald-700 hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] border-b border-border bg-cream-dark">
        <span className="pointer-events-none absolute inset-3 z-[2] border border-gold-500/40" />
        {person.photo_url ? (
          <Image
            src={person.photo_url}
            alt={person.full_name}
            fill
            sizes="(max-width: 768px) 50vw, 260px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream-dark to-cream font-display text-6xl font-medium text-emerald-800">
            {initialsOf(person.full_name)}
          </span>
        )}
        {badge && (
          <span className="absolute right-4 top-4 z-[3] bg-emerald-900 px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.1em] text-gold-400">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="mb-1.5 font-display text-[22px] font-semibold leading-tight text-emerald-900">
          {person.full_name}
        </h3>
        <p className="mb-2.5 font-serif text-[14px] italic text-ink-soft">
          {orPlaceholder(person.occupation)}
        </p>
        <p className="flex items-center gap-1.5 font-sans text-[12px] tracking-[0.04em] text-ink-muted">
          {orPlaceholder(person.city ?? person.country)}
        </p>
      </div>
    </button>
  );
}

/** Compact list-view row. */
export function AlumniRow({
  person,
  onOpen,
}: {
  person: Alumni;
  onOpen: (a: Alumni) => void;
}) {
  const badge = classBadge(person.class_year);
  return (
    <button
      onClick={() => onOpen(person)}
      className="grid w-full grid-cols-[40px_1fr] items-center gap-3 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-cream-dark sm:grid-cols-[48px_2fr_1fr_1.5fr] sm:gap-6 sm:px-6"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 font-display text-[17px] font-semibold text-gold-400 sm:h-12 sm:w-12 sm:text-[20px]">
        {initialsOf(person.full_name)}
      </span>
      {/* On a phone only the name + class show; profession and location would
          force the whole page to scroll sideways. Tapping opens the full card. */}
      <span className="min-w-0">
        <span className="block truncate font-display text-[18px] font-semibold text-emerald-900 sm:text-[20px]">
          {person.full_name}
        </span>
        <span className="block truncate font-sans text-[12px] tracking-[0.06em] text-ink-muted">
          {badge ? `Class of ${badge}` : "Year not provided"}
          <span className="sm:hidden">
            {person.occupation ? ` · ${person.occupation}` : ""}
          </span>
        </span>
      </span>
      <span className="hidden min-w-0 truncate text-[14px] text-ink-soft sm:block">
        {orPlaceholder(person.occupation)}
      </span>
      <span className="hidden min-w-0 truncate text-[14px] text-ink-soft sm:block">
        {orPlaceholder(person.city ?? person.country)}
      </span>
    </button>
  );
}
