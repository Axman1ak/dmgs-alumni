export type BudgetLine = { label: string; amount: number; note?: string };

export type Project = {
  slug: string;
  tag: string;
  title: string;
  tagline: string;
  /** Optional real photo in /public/projects/{slug}.jpg — falls back to art. */
  photo?: string;
  art: "bursary" | "labs" | "library";
  goal: number;
  raised: number;
  idea: string[];
  budget: BudgetLine[];
  impact: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "bursary-fund",
    tag: "Bursary Fund",
    title: "Send a bright student to school",
    tagline:
      "A full year of schooling for a child who would otherwise be sent home.",
    art: "bursary",
    goal: 1_500_000,
    raised: 0,
    idea: [
      "Every term, promising students at Doherty Memorial are sent home because their families cannot raise the fees. Talent isn't the barrier — a few thousand naira is.",
      "The Bursary Fund closes that gap. Alumni cover tuition, uniforms, books, and exam fees for the students the school identifies as most capable and most in need. No child who can learn should lose the chance over money.",
      "Recipients are nominated by their teachers and reviewed by the association. Every dispersal is recorded and published back to donors.",
    ],
    budget: [
      { label: "Tuition & levies — 10 students", amount: 750_000 },
      { label: "Uniforms & textbooks", amount: 300_000 },
      { label: "WAEC / exam registration", amount: 250_000 },
      { label: "Meals & transport support", amount: 200_000 },
    ],
    impact: "10 students carried through a full academic year.",
  },
  {
    slug: "science-labs",
    tag: "Science Labs",
    title: "Re-equip the laboratories",
    tagline: "Real instruments for physics, chemistry, and biology.",
    art: "labs",
    goal: 3_000_000,
    raised: 0,
    idea: [
      "For years, science at Doherty has been taught from the board — students memorise experiments they've never run. In a school that has produced doctors and engineers across three continents, that's a loss the association can fix.",
      "This project re-equips all three laboratories with working glassware, apparatus, microscopes, and the safety fittings a modern lab needs, so the next generation learns science by doing it.",
      "Equipment is bought against published quotes, and the receipts are shared with every donor after purchase.",
    ],
    budget: [
      { label: "Chemistry glassware & reagents", amount: 900_000 },
      { label: "Physics apparatus", amount: 800_000 },
      { label: "Biology microscopes & specimens", amount: 700_000 },
      { label: "Benches, fittings & safety gear", amount: 600_000 },
    ],
    impact: "Three working labs serving roughly 600 students a year.",
  },
  {
    slug: "library-digital",
    tag: "Library & Digital",
    title: "Books and a computer room",
    tagline: "A restocked library and internet-connected computers.",
    art: "library",
    goal: 2_500_000,
    raised: 0,
    idea: [
      "The library shelves are thin and there isn't a single working computer on campus. Students leave school having never sat at a keyboard — a real handicap the moment they step into the wider world.",
      "This project refills the library with current books and builds a small computer room: fifteen desktops, networking, and an internet connection the whole school can share.",
      "Hardware is purchased at published prices and inventoried on delivery, with the list shared back to donors.",
    ],
    budget: [
      { label: "New books & shelving", amount: 700_000 },
      { label: "15 desktop computers", amount: 1_050_000 },
      { label: "Internet & networking", amount: 450_000 },
      { label: "Furniture & lighting", amount: 300_000 },
    ],
    impact: "A stocked library and a computer room for the whole school.",
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
