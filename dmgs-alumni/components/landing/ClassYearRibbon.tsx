/**
 * Continuous ribbon of class years — the "yearbook spine" motif.
 * Pure CSS marquee (see .marquee / .marquee-track in globals.css),
 * so it stays a server component. Pauses on hover.
 */
const YEARS = [
  "’55", "’58", "’61", "’64", "’67", "’70",
  "’73", "’76", "’79", "’82", "’85", "’88",
  "’91", "’94", "’97", "’00", "’04", "’08",
  "’12", "’16", "’20", "’24",
];

function Run({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center"
    >
      {YEARS.map((y, i) => (
        <span key={`${y}-${i}`} className="flex items-center">
          <span className="mx-5 flex items-baseline gap-2.5 whitespace-nowrap sm:mx-7">
            <span className="font-sans text-[9px] font-medium uppercase tracking-[0.34em] text-gold-400/60">
              Class of
            </span>
            <span className="font-display text-[26px] italic leading-none text-cream/90">
              {y}
            </span>
          </span>
          <svg
            viewBox="0 0 8 8"
            className="h-2 w-2 text-gold-500/70"
            aria-hidden="true"
          >
            <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="currentColor" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export function ClassYearRibbon() {
  return (
    <div className="marquee border-y border-gold-500/25 bg-emerald-800 py-4">
      <div className="marquee-track">
        <Run />
        <Run ariaHidden />
      </div>
    </div>
  );
}
