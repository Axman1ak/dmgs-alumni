export type BudgetLine = { label: string; amount: number };
export type ProjectArtStyle = "bursary" | "labs" | "library";

export type Project = {
  id: string;
  slug: string;
  tag: string;
  title: string;
  tagline: string | null;
  idea: string[];
  budget: BudgetLine[];
  art: ProjectArtStyle;
  photo: string | null;
  goal: number;
  impact: string | null;
};

/** Normalise a raw `projects` row (jsonb columns) into a typed Project. */
export function mapProject(row: any): Project {
  const idea = Array.isArray(row.idea)
    ? row.idea
    : typeof row.idea === "string"
      ? JSON.parse(row.idea)
      : [];
  const budgetRaw = Array.isArray(row.budget)
    ? row.budget
    : typeof row.budget === "string"
      ? JSON.parse(row.budget)
      : [];
  return {
    id: row.id,
    slug: row.slug,
    tag: row.tag,
    title: row.title,
    tagline: row.tagline ?? null,
    idea: idea as string[],
    budget: (budgetRaw as any[]).map((b) => ({
      label: String(b.label),
      amount: Number(b.amount),
    })),
    art: (["bursary", "labs", "library"].includes(row.art) ? row.art : "library") as ProjectArtStyle,
    photo: row.photo_url ?? null,
    goal: Number(row.goal ?? 0),
    impact: row.impact ?? null,
  };
}

/** Turn "Label | 750000" lines into budget rows. */
export function parseBudget(text: string): BudgetLine[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, amount] = l.split("|");
      return { label: (label ?? "").trim(), amount: Number((amount ?? "0").replace(/[^0-9.]/g, "")) };
    })
    .filter((b) => b.label);
}

/** Turn paragraphs separated by blank lines into an array. */
export function parseIdea(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
