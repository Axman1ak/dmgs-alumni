/**
 * Rotating circular inscription around the school monogram — a wax-seal
 * flourish used to sign off compositions. Server-safe (CSS animation only).
 */
export function CrestRing({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="spin-slow h-full w-full text-gold-400">
        <defs>
          <path
            id="crest-ring-path"
            d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0"
            fill="none"
          />
        </defs>
        <text
          fill="currentColor"
          fontSize="12"
          letterSpacing="3.2"
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          <textPath href="#crest-ring-path">
            DOHERTY MEMORIAL GRAMMAR SCHOOL · EST. 1955 · IJERO-EKITI ·
          </textPath>
        </text>
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </svg>
      <span className="crest absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-[24px]">
        D
      </span>
    </div>
  );
}
