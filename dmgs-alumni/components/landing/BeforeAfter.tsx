"use client";

import { useState } from "react";

/** Drag-to-compare photo: the "after" picture is revealed over the "before". */
export function BeforeAfter({ before, after, label }: { before: string; after: string; label: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ld-ba" style={{ ["--pos" as string]: `${pos}%` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="before" src={before} alt={`${label}, before the work`} loading="lazy" />
      <div className="after-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt={`${label}, after the work`} loading="lazy" />
      </div>
      <span className="tag a">After</span>
      <span className="tag b">Before</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`Drag to compare before and after: ${label}`} />
      <div className="knob" aria-hidden="true">
        <span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e3b2e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
