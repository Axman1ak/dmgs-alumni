/**
 * Event timing helpers. Dates are shown in Lagos time (WAT, UTC+1, no
 * daylight saving), and an event stays "upcoming" for the whole of its day,
 * so a meeting later today (or earlier today) never jumps straight to Past.
 */
const DAY = 86_400_000;
const WAT = 3_600_000; // UTC+1

/** ISO timestamp of 00:00 today, Lagos time. */
export function startOfTodayLagos(now = Date.now()): string {
  return new Date(Math.floor((now + WAT) / DAY) * DAY - WAT).toISOString();
}

export function isUpcoming(e: { starts_at: string; ends_at?: string | null; status?: string }, now = Date.now()): boolean {
  if (e.status === "cancelled") return false;
  const cutoff = Date.parse(startOfTodayLagos(now));
  const end = e.ends_at ? Date.parse(e.ends_at) : Date.parse(e.starts_at);
  return Date.parse(e.starts_at) >= cutoff || end >= now;
}
