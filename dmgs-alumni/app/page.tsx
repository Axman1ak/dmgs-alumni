import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Reveal } from "@/components/donations/Reveal";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SCHOOL = "https://www.dohertyijero.com.ng";
// Self-hosted in /public. Previously these were hotlinked from the school's
// WordPress site; the 900KB library PNG regularly failed to load on mobile
// connections, leaving a broken image on the page.
const HERO_IMG = "/entrance.png";
const LIB_IMG = "/school.png";

const SCHOOL_LINKS = [
  { href: `${SCHOOL}/`, label: "School Home", note: "The official DMGS website" },
  { href: `${SCHOOL}/our-school/`, label: "Our School", note: "History since 1955" },
  { href: `${SCHOOL}/alumni/`, label: "Old Students", note: "OSA news and notices" },
  { href: `${SCHOOL}/gallery/`, label: "Gallery", note: "Photos of campus and events" },
  { href: `${SCHOOL}/news/`, label: "News", note: "Latest from the school" },
  { href: `${SCHOOL}/contact-us/`, label: "Contact", note: "Reach the school" },
];

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let approved = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();
    approved = data?.status === "approved";
  }

  const years = new Date().getFullYear() - 1955;

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[76vh] items-center overflow-hidden">
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_IMG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/85 via-emerald-900/70 to-emerald-900/90" />
          <div className="texture-diagonal absolute inset-0 opacity-60" />

          <div className="relative mx-auto w-full max-w-[1100px] px-5 sm:px-8 py-24 text-center text-cream">
            <p className="animate-fadeIn mb-5 font-sans text-[12px] font-semibold uppercase tracking-[0.28em] text-gold-400">
              Est. 7 February 1955 &middot; Ijero-Ekiti
            </p>
            <h1 className="animate-fadeIn mx-auto max-w-4xl font-display text-[clamp(34px,7vw,88px)] font-medium leading-[0.98] tracking-[-0.02em]">
              Once a Doherty student, <em className="italic text-gold-400">always</em> family.
            </h1>
            <p className="animate-fadeIn mx-auto mt-6 max-w-[600px] text-[18px] leading-relaxed text-cream/85">
              The home of the Doherty Memorial Grammar School Old Students
              Association, reconnecting classmates across Nigeria, the United
              States, Canada, the United Kingdom, and beyond.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {approved ? (
                <>
                  <Link href="/directory" className="btn btn-gold">
                    Enter the directory
                  </Link>
                  <Link
                    href="/events"
                    className="btn btn-outline border-cream/40 text-cream hover:border-gold-400 hover:text-gold-400"
                  >
                    See events
                  </Link>
                </>
              ) : user ? (
                <Link href="/pending" className="btn btn-gold">
                  Your membership status
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="btn btn-gold">
                    Request membership
                  </Link>
                  <Link
                    href="/login"
                    className="btn btn-outline border-cream/40 text-cream hover:border-gold-400 hover:text-gold-400"
                  >
                    Member sign in
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            {/* Grid, not flex-wrap: with four stats the last one ("5+ countries
                reunited") was dropping onto a second line. 4 across on desktop,
                2x2 on a phone. */}
            <div className="mx-auto mt-12 grid max-w-[860px] grid-cols-2 gap-x-6 gap-y-8 border-t border-cream/20 pt-9 sm:grid-cols-4 sm:gap-x-8">
              {[
                { num: `${years}`, label: "Years of legacy" },
                { num: "1955", label: "Founded" },
                { num: "3", label: "Oldest schools in Ekiti" },
                { num: "5+", label: "Countries reunited" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-[40px] font-semibold leading-none text-gold-400">
                    {s.num}
                  </div>
                  <div className="mt-2 font-sans text-[11px] uppercase tracking-[0.16em] text-cream/70">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The school */}
        <section className="mx-auto max-w-[1200px] px-5 sm:px-8 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              {/* Fixed aspect ratio: without it, a slow or failed image left a
                  huge empty box on mobile instead of a photo. */}
              <div className="relative aspect-[4/3] overflow-hidden border border-border bg-emerald-900 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LIB_IMG}
                  alt="Doherty Memorial Grammar School"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <span className="absolute bottom-0 left-0 bg-emerald-900/90 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.16em] text-gold-400 backdrop-blur">
                  Ijero-Ekiti, Nigeria
                </span>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div>
                <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.2em] text-gold-500">
                  The school
                </p>
                <h2 className="mb-5 font-display text-[30px] font-medium leading-tight text-emerald-900 sm:text-[40px]">
                  Leaders of tomorrow, since 1955
                </h2>
                <div className="space-y-4 font-serif text-[17px] leading-relaxed text-ink-soft">
                  <p>
                    Founded on 7 February 1955, Doherty Memorial Grammar School is
                    one of the three oldest schools in Ekiti State. It was named
                    for the Doherty family, whose children helped provide the funds
                    that launched the college.
                  </p>
                  <p>
                    In 1956, just a year after its first thirty students resumed,
                    eight Doherty boys were chosen to meet the Queen of England
                    during her visit to Nigeria. The school became co-educational
                    in 1967, and has since sent generations of graduates into
                    medicine, engineering, law, and public life across the world.
                  </p>
                  <p className="border-l-2 border-gold-500 pl-4 font-sans text-[15px] italic text-ink-muted">
                    &ldquo;To defend the integrity of Doherty Memorial Grammar
                    School by performing extraordinary acts extraordinarily.&rdquo;
                  </p>
                </div>
                <a
                  href={`${SCHOOL}/our-school/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-7"
                >
                  Visit the school&rsquo;s website
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Explore the school online */}
        <section className="border-y border-border bg-cream px-5 sm:px-8 py-16">
          <div className="mx-auto max-w-[1200px]">
            <Reveal>
              <div className="mb-8 flex items-baseline justify-between border-b border-border pb-3">
                <h2 className="font-display text-[28px] font-medium text-emerald-900">
                  Explore the school online
                </h2>
                <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-gold-500">
                  dohertyijero.com.ng
                </span>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SCHOOL_LINKS.map((l, i) => (
                <Reveal key={l.href} delay={i * 60}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border border-border bg-paper px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-emerald-700 hover:shadow-soft"
                  >
                    <span>
                      <span className="block font-display text-[20px] font-semibold text-emerald-900">
                        {l.label}
                      </span>
                      <span className="font-sans text-[12px] text-ink-muted">{l.note}</span>
                    </span>
                    <span className="font-sans text-[18px] text-gold-500 transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Your community */}
        <section className="mx-auto max-w-[1200px] px-5 sm:px-8 py-20">
          <Reveal>
            <h2 className="mb-10 text-center font-display text-[28px] font-medium text-emerald-900 sm:text-[36px]">
              Your community, in one place
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Find your classmates",
                body: "A searchable, yearbook-style directory of old students by name, class year, profession, and location.",
              },
              {
                title: "Gather again",
                body: "Reunions, virtual meetups, and homecomings with RSVP, wherever in the world you are.",
              },
              {
                title: "Give back",
                body: "Support the school and your class projects securely, with transparent class-by-class giving.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 90}>
                <div className="h-full border border-border bg-cream p-8 shadow-soft transition-transform hover:-translate-y-1">
                  <h3 className="mb-3 font-display text-[24px] font-semibold text-emerald-900">
                    {c.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!approved && (
          <section className="texture-diagonal bg-emerald-900 px-5 sm:px-8 py-20 text-center text-cream">
            <Reveal>
              <h2 className="mx-auto max-w-[560px] font-display text-[30px] font-medium leading-tight sm:text-[40px]">
                Rejoin the Doherty family
              </h2>
              <p className="mx-auto mt-4 max-w-[440px] font-serif text-[17px] italic text-cream/85">
                Request your membership today, and an administrator will verify and
                welcome you in.
              </p>
              <Link href={user ? "/pending" : "/signup"} className="btn btn-gold mt-8 px-5 sm:px-8 py-4">
                {user ? "Your membership status" : "Request membership"}
              </Link>
            </Reveal>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
