"use client";

import { useState } from "react";

/** "Find your class": counts only, never names. */
export function ClassFinder({ counts }: { counts: { class_year: number; people: number }[] }) {
  const [year, setYear] = useState("");
  const hit = counts.find((c) => String(c.class_year) === year);
  const msg = !year
    ? "Choose your year to see how many of your classmates are already here."
    : year === "other"
      ? "Your class is not on the register yet. Be the first of your year to join."
      : `${hit?.people ?? 0} of your Class of ${year} classmates are already on the register.`;
  return (
    <div className="ld-finder ld-reveal">
      <label className="m-eyebrow" htmlFor="ld-year">Find your class</label>
      <select id="ld-year" className="m-input" value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">Select your graduation year</option>
        {counts.map((c) => (
          <option key={c.class_year} value={c.class_year}>Class of {c.class_year}</option>
        ))}
        <option value="other">My year is not listed</option>
      </select>
      <p aria-live="polite">{msg}</p>
    </div>
  );
}
