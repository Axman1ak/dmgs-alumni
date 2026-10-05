"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Dismissible "complete your profile" notice. Dismissal is remembered in this
 * browser only; the notice comes back if the profile is still incomplete on
 * another device.
 */
export function ProfileNotice({ pct, userId }: { pct: number; userId: string }) {
  const key = `dmgs-profile-notice-${userId}`;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(key) === "dismissed");
    } catch {
      setHidden(false);
    }
  }, [key]);

  if (hidden || pct >= 100) return null;

  return (
    <div className="m-notice" role="status">
      <div className="m-wrap m-notice-in">
        <span
          className="m-ring"
          aria-hidden="true"
          style={{ ["--p" as string]: pct, ["--c" as string]: "var(--m-gold)", ["--t" as string]: "#ece4cf", ["--s" as string]: "4px", width: 28, height: 28 }}
        />
        <span>
          <b>Your profile is {pct}% complete.</b> Add your work, interests and links so classmates can find you.
        </span>
        <Link className="m-link" href="/account" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
          Complete profile
        </Link>
        <button
          type="button"
          className="x"
          aria-label="Dismiss"
          onClick={() => {
            try {
              localStorage.setItem(key, "dismissed");
            } catch {}
            setHidden(true);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
