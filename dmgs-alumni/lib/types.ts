export type Alumni = {
  id: string;
  profile_id: string | null;
  full_name: string;
  class_year: number | null;
  occupation: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  photo_url: string | null;
  chapter: string | null;
  is_published: boolean;
};

export type EventFormat = "in_person" | "virtual" | "hybrid";

export type AlumniEvent = {
  id: string;
  title: string;
  description: string | null;
  format: EventFormat;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  zoom_url: string | null;
  status: "scheduled" | "cancelled";
};

/** Initials for the framed-portrait / avatar placeholder. */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Two-digit class-year badge, e.g. 1977 -> "'77". */
export function classBadge(year: number | null): string | null {
  if (!year) return null;
  return "'" + String(year % 100).padStart(2, "0");
}

/** Null-safe display helper. */
export function orPlaceholder(value: string | null | undefined): string {
  return value && value.trim() ? value : "Not provided";
}
