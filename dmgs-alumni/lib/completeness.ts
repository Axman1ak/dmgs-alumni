/** Profile completeness, shared by the Home notice and the profile page. */
export type ProfileLike = {
  first_name?: string | null;
  last_name?: string | null;
  class_year?: number | null;
  country?: string | null;
  state?: string | null;
  industry?: string | null;
  job_title?: string | null;
  employer?: string | null;
  interests?: string[] | null;
  connect_pref?: string | null;
  linkedin_url?: string | null;
  social_url?: string | null;
};

export function profileChecks(p: ProfileLike | null): [string, boolean][] {
  const f = p ?? {};
  return [
    ["Names", Boolean(f.first_name && f.last_name)],
    ["Class", Boolean(f.class_year)],
    ["Country & state", Boolean(f.country && f.state)],
    ["Industry, job title & employer", Boolean(f.industry && f.job_title && (f.employer || f.industry === "Retired"))],
    ["Areas of interest", (f.interests ?? []).length > 0],
    ["Willingness to connect", Boolean(f.connect_pref)],
    ["LinkedIn or social link", Boolean(f.linkedin_url || f.social_url)],
  ];
}

export function profilePct(p: ProfileLike | null): number {
  const c = profileChecks(p);
  return Math.round((c.filter(([, ok]) => ok).length / c.length) * 100);
}
