"use client";

import { useEffect, useRef, useState } from "react";
import type { BudgetLine } from "@/lib/projects";
import { ngn } from "@/lib/format";

const PALETTE = ["#0e3b2e", "#246b54", "#b88a3e", "#d4a656"];

export function BudgetBreakdown({
  lines,
  goal,
}: {
  lines: BudgetLine[];
  goal: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const max = Math.max(...lines.map((l) => l.amount));

  return (
    <div ref={ref}>
      {/* Stacked allocation bar */}
      <div className="mb-8 flex h-6 w-full overflow-hidden rounded-full border border-border">
        {lines.map((l, i) => (
          <div
            key={l.label}
            title={`${l.label}: ${ngn(l.amount)}`}
            style={{
              width: active ? `${(l.amount / goal) * 100}%` : "0%",
              background: PALETTE[i % PALETTE.length],
              transition: `width 0.9s cubic-bezier(0.2,0.8,0.2,1) ${i * 120}ms`,
            }}
          />
        ))}
      </div>

      {/* Line items */}
      <div className="space-y-5">
        {lines.map((l, i) => (
          <div key={l.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="flex items-center gap-2 font-serif text-[16px] text-ink">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                {l.label}
              </span>
              <CountUp value={l.amount} active={active} className="font-display text-[18px] font-semibold text-emerald-900" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-cream-dark">
              <div
                className="h-full rounded-full"
                style={{
                  width: active ? `${(l.amount / max) * 100}%` : "0%",
                  background: PALETTE[i % PALETTE.length],
                  transition: `width 0.9s cubic-bezier(0.2,0.8,0.2,1) ${i * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-7 flex items-baseline justify-between border-t-2 border-emerald-900 pt-4">
        <span className="font-display text-[22px] font-semibold text-emerald-900">
          Total goal
        </span>
        <CountUp value={goal} active={active} className="font-display text-[26px] font-semibold text-emerald-900" />
      </div>
      <p className="mt-4 font-sans text-[12px] leading-relaxed text-ink-muted">
        100% of every gift is allocated to the line items above. The association
        publishes receipts to donors after each disbursement.
      </p>
    </div>
  );
}

function CountUp({
  value,
  active,
  className = "",
}: {
  value: number;
  active: boolean;
  className?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);

  return <span className={className}>{ngn(n)}</span>;
}
