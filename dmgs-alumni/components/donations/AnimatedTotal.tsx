"use client";

import { useEffect, useRef, useState } from "react";
import { ngn } from "@/lib/format";

/** Counts up from 0 to `value` once, the first time it scrolls into view. */
export function AnimatedTotal({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !ran.current) {
            ran.current = true;
            const start = performance.now();
            const dur = 1000;
            const step = (t: number) => {
              const p = Math.min((t - start) / dur, 1);
              setN(Math.round(value * p));
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return <span ref={ref}>{ngn(n)}</span>;
}
