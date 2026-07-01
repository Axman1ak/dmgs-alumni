import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border px-8 pb-16 pt-20 text-center">
          <p className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500">
            Est. 1955 · Ijero-Ekiti
          </p>
          <h1 className="mx-auto mb-6 max-w-4xl font-display text-[clamp(44px,7vw,84px)] font-medium leading-none tracking-[-0.02em] text-emerald-900">
            Once a Doherty student, <em className="font-normal not-italic text-gold-500 italic">always</em> family.
          </h1>
          <p className="mx-auto mb-10 max-w-[620px] text-[18px] leading-relaxed text-ink-soft">
            The home of the Doherty Memorial Grammar School Old Students
            Association — reconnecting classmates across Nigeria, the United
            States, Canada, the United Kingdom, and beyond.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn btn-primary">
              Request membership
            </Link>
            <Link href="/login" className="btn btn-outline">
              Member sign in
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 flex max-w-[720px] flex-wrap justify-center gap-x-16 gap-y-8 border-t border-border pt-9">
            {[
              { num: "70", label: "Years of legacy" },
              { num: "5+", label: "Countries" },
              { num: "1955", label: "Founded" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-[40px] font-semibold leading-none text-emerald-900">
                  {s.num}
                </div>
                <div className="mt-2 font-sans text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Intro band */}
        <section className="mx-auto max-w-[1280px] px-8 py-16">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Find your classmates",
                body: "A searchable, yearbook-style directory of alumni by name, class year, profession, and location.",
              },
              {
                title: "Gather again",
                body: "Reunions, virtual meetups, and hybrid events with RSVP — wherever in the world you are.",
              },
              {
                title: "Give back",
                body: "Support the school and your class projects securely, with transparent class-by-class giving.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="border border-border bg-cream p-7 shadow-soft"
              >
                <h3 className="mb-3 font-display text-[24px] font-semibold text-emerald-900">
                  {c.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
