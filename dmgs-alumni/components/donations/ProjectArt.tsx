import type { Project } from "@/lib/projects";

/**
 * Hero visual for a project. If the project has a real photo in
 * /public/projects/{slug}.jpg it's used; otherwise a on-brand illustrated
 * scene is rendered. Swapping in a real photo needs no code change beyond
 * setting `photo` on the project.
 */
export function ProjectArt({
  project,
  className = "",
}: {
  project: Project;
  className?: string;
}) {
  if (project.photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Plain img: project.photo is admin-supplied and may point at any host,
            which next/image would reject unless the domain is pre-whitelisted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.photo}
          alt={project.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className={`overflow-hidden ${className}`}>
      <Scene art={project.art} />
    </div>
  );
}

function Scene({ art }: { art: Project["art"] }) {
  const common = { emerald: "#0e3b2e", emerald2: "#1a5240", gold: "#b88a3e", gold2: "#d4a656", cream: "#f5efe1" };
  return (
    <svg viewBox="0 0 800 450" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={common.emerald} />
          <stop offset="1" stopColor={common.emerald2} />
        </linearGradient>
        <pattern id="diag" width="42" height="42" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="42" height="41" fill="none" />
          <line x1="0" y1="0" x2="0" y2="42" stroke={common.gold2} strokeOpacity="0.06" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="800" height="450" fill="url(#bg)" />
      <rect width="800" height="450" fill="url(#diag)" />

      {art === "bursary" && <Bursary c={common} />}
      {art === "labs" && <Labs c={common} />}
      {art === "library" && <Library c={common} />}
    </svg>
  );
}

type C = { emerald: string; emerald2: string; gold: string; gold2: string; cream: string };

function Bursary({ c }: { c: C }) {
  return (
    <g>
      {/* sun */}
      <circle cx="620" cy="150" r="70" fill={c.gold2} opacity="0.9" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={620 + Math.cos(a) * 88}
            y1={150 + Math.sin(a) * 88}
            x2={620 + Math.cos(a) * 108}
            y2={150 + Math.sin(a) * 108}
            stroke={c.gold2}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
        );
      })}
      {/* hills */}
      <path d="M0 380 Q200 320 400 360 T800 350 V450 H0 Z" fill={c.emerald2} />
      <path d="M0 410 Q250 360 500 400 T800 395 V450 H0 Z" fill={c.gold} opacity="0.25" />
      {/* graduation cap */}
      <g transform="translate(300 210)">
        <polygon points="0,40 110,10 220,40 110,70" fill={c.cream} />
        <path d="M40 55 V95 Q110 130 180 95 V55" fill="none" stroke={c.cream} strokeWidth="8" />
        <line x1="220" y1="40" x2="220" y2="95" stroke={c.gold2} strokeWidth="4" />
        <circle cx="220" cy="100" r="8" fill={c.gold2} />
      </g>
    </g>
  );
}

function Labs({ c }: { c: C }) {
  return (
    <g>
      {/* molecule */}
      <g opacity="0.8">
        <line x1="560" y1="120" x2="650" y2="90" stroke={c.gold2} strokeWidth="4" />
        <line x1="560" y1="120" x2="620" y2="200" stroke={c.gold2} strokeWidth="4" />
        <circle cx="560" cy="120" r="16" fill={c.gold2} />
        <circle cx="650" cy="90" r="12" fill={c.cream} />
        <circle cx="620" cy="200" r="12" fill={c.cream} />
      </g>
      {/* flask */}
      <g transform="translate(150 130)">
        <path d="M70 0 V70 L20 190 Q15 210 40 210 H180 Q205 210 200 190 L150 70 V0 Z" fill="none" stroke={c.cream} strokeWidth="7" strokeLinejoin="round" />
        <path d="M45 150 L175 150 L200 195 Q205 210 180 210 H40 Q15 210 20 190 Z" fill={c.gold} opacity="0.85" />
        <line x1="60" y1="0" x2="160" y2="0" stroke={c.cream} strokeWidth="9" strokeLinecap="round" />
        <circle cx="95" cy="175" r="6" fill={c.cream} opacity="0.8" />
        <circle cx="130" cy="165" r="4" fill={c.cream} opacity="0.7" />
        <circle cx="115" cy="185" r="5" fill={c.cream} opacity="0.6" />
      </g>
      {/* test tube */}
      <g transform="translate(360 190)">
        <path d="M0 0 V150 Q0 180 25 180 Q50 180 50 150 V0" fill="none" stroke={c.cream} strokeWidth="6" />
        <path d="M2 110 H48 V150 Q48 176 25 176 Q2 176 2 150 Z" fill={c.gold2} opacity="0.8" />
      </g>
    </g>
  );
}

function Library({ c }: { c: C }) {
  const spines = [c.gold2, c.cream, c.gold, c.cream, c.gold2, c.cream, c.gold];
  return (
    <g>
      {/* window with light */}
      <g transform="translate(560 70)">
        <rect x="0" y="0" width="150" height="200" rx="6" fill={c.emerald2} stroke={c.gold2} strokeWidth="4" />
        <line x1="75" y1="0" x2="75" y2="200" stroke={c.gold2} strokeWidth="3" />
        <line x1="0" y1="100" x2="150" y2="100" stroke={c.gold2} strokeWidth="3" />
        <polygon points="0,200 150,60 150,200" fill={c.gold2} opacity="0.12" />
      </g>
      {/* bookshelf */}
      <g transform="translate(90 120)">
        {[0, 90].map((row) => (
          <g key={row} transform={`translate(0 ${row})`}>
            <rect x="0" y="70" width="360" height="10" fill={c.gold} opacity="0.7" />
            {spines.map((col, i) => {
              const h = 50 + ((i * 7) % 20);
              return (
                <rect
                  key={i}
                  x={10 + i * 50}
                  y={70 - h}
                  width={36}
                  height={h}
                  rx="2"
                  fill={col}
                  opacity={col === c.cream ? 0.9 : 0.95}
                />
              );
            })}
          </g>
        ))}
      </g>
    </g>
  );
}
