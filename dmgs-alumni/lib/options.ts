/**
 * Fixed choices for the membership profile (Mike's list, Oct 2026).
 * Kept in one place so the profile form, the directory filters and the
 * database values always match. Edit the lists here to change them.
 */

export const INDUSTRIES = [
  "Accounting & Finance",
  "Agriculture",
  "Architecture & Construction",
  "Arts, Media & Communications",
  "Banking",
  "Business & Management",
  "Civil Service & Government",
  "Education",
  "Engineering",
  "Healthcare & Medicine",
  "Information Technology",
  "Law",
  "Manufacturing",
  "Non-profit & Religious",
  "Oil, Gas & Energy",
  "Retail & Trade",
  "Science & Research",
  "Transport & Logistics",
  "Retired",
  "Other",
] as const;

export const INTERESTS = [
  "Mentoring students",
  "Career advice",
  "Business networking",
  "Fundraising & projects",
  "Reunions & events",
  "Class coordination",
  "Volunteering on campus",
  "Sports",
  "Football",
  "Hiking",
  "Gaming",
  "Music",
  "Reading",
  "Travel",
  "Cooking",
  "Technology",
  "Entrepreneurship",
  "Arts & culture",
  "Photography",
  "Faith & community",
] as const;

export const MAX_INTERESTS = 12;
export const MAX_INTEREST_LEN = 30;

/**
 * Clean a free-text interest: trim, collapse spaces, cap the length and
 * capitalise the first letter. Returns null when nothing usable is left.
 */
export function cleanInterest(raw: string): string | null {
  const v = raw.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_INTEREST_LEN);
  if (v.length < 2) return null;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** Dedupe interests case-insensitively, keeping the first spelling. */
export function uniqueInterests(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = cleanInterest(raw);
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out.slice(0, MAX_INTERESTS);
}

export type ConnectPref = "mentor" | "network" | "none";

export const CONNECT: Record<ConnectPref, { label: string; hint: string }> = {
  mentor: { label: "Open to mentoring", hint: "Happy to guide younger old students and current pupils." },
  network: { label: "Open to networking", hint: "Happy to hear from old students about work and opportunities." },
  none: { label: "Not at the moment", hint: "Classmates can still send messages." },
};

export const COUNTRIES = [
  "Nigeria",
  "United Kingdom",
  "United States",
  "Canada",
  "Ghana",
  "South Africa",
  "Ireland",
  "Germany",
  "United Arab Emirates",
  "Other",
] as const;

/** Directory row as returned by the `directory_people` view. */
export type Person = {
  id: string;
  profile_id: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  maiden_name: string | null;
  former_name: string | null;
  class_year: number | null;
  country: string | null;
  state: string | null;
  industry: string | null;
  job_title: string | null;
  employer: string | null;
  interests: string[] | null;
  connect_pref: ConnectPref | null;
  linkedin_url: string | null;
  social_url: string | null;
  photo_url: string | null;
  email: string | null;
  email_shared: boolean;
};

/** Accept "linkedin.com/in/x" or a full URL; return a safe https link or null. */
export function safeUrl(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
