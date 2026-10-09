"use client";

import { useState } from "react";

/** Reveals extra server-rendered content (e.g. more project cards) on demand. */
export function ShowMore({ count, label, children }: { count: number; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <>
      {open && children}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" className="m-btn m-btn-line" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Show fewer projects" : `${label} (${count})`}
        </button>
      </div>
    </>
  );
}
