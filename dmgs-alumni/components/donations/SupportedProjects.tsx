/**
 * "Where your gift goes" — the causes donations fund. Placeholder content the
 * super admin can replace with the association's real projects (easy to make
 * database-driven later).
 */
const PROJECTS = [
  {
    tag: "Bursary Fund",
    title: "Send a bright student to school",
    body: "Full scholarships for promising pupils whose families can’t cover fees — the fastest way your gift changes a life.",
  },
  {
    tag: "Science Labs",
    title: "Re-equip the laboratories",
    body: "Restock the physics, chemistry, and biology labs so today’s students learn with real instruments, not chalk diagrams.",
  },
  {
    tag: "Library",
    title: "Books & digital learning",
    body: "Refill the library shelves and bring computers and internet access to every classroom on the Ijero campus.",
  },
];

export function SupportedProjects() {
  return (
    <section className="mb-14">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display text-[28px] font-medium text-emerald-900">
          Where your gift goes
        </h2>
        <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-gold-500">
          Current priorities
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <article
            key={p.tag}
            className="flex flex-col overflow-hidden border border-border bg-cream shadow-soft"
          >
            <div className="flex items-center justify-between bg-emerald-900 px-5 py-3 text-cream">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400">
                {p.tag}
              </span>
              <span className="font-display text-[22px] font-medium text-gold-400">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="mb-2.5 font-display text-[24px] font-semibold leading-tight text-emerald-900">
                {p.title}
              </h3>
              <p className="font-serif text-[15px] leading-relaxed text-ink-soft">
                {p.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
