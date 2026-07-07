import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Reveal } from "@/components/donations/Reveal";
import { Parallax } from "@/components/landing/Parallax";
import { ClassYearRibbon } from "@/components/landing/ClassYearRibbon";
import { CrestRing } from "@/components/landing/CrestRing";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SCHOOL = "https://www.dohertyijero.com.ng";
// Real photos served from the school's official site. Swap for self-hosted
// files in /public whenever you have higher-resolution originals.
const HERO_IMG = `${SCHOOL}/wp-content/uploads/entrance.png`;
const LIB_IMG = `${SCHOOL}/wp-content/uploads/lib.png`;

const SCHOOL_LINKS = [
  { href: `${SCHOOL}/`, label: "School Home", note: "The official DMGS website" },
  { href: `${SCHOOL}/our-school/`, label: "Our School", note: "History since 1955" },
  { href: `${SCHOOL}/alumni/`, label: "Alumni", note: "OSA news & notices" },
  { href: `${SCHOOL}/gallery/`, label: "Gallery", note: "Photos of campus & events" },
  { href: `${SCHOOL}/news/`, label: "News", note: "Latest from the school" },
  { href: `${SCHOOL}/contact-us/`, label: "Contact", note: "Reach the school" },
];

const FELLOWSHIP = [
  {
    numeral: "I",
    title: "Find your classmates",
    body: "A yearbook-style register of old students — searchable by name, class year, profession, and the corner of the world they now call home.",
    emblem: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M12 6c-2-1.6-4.7-2.2-8-2.2v14c3.3 0 6 .6 8 2.2 2-1.6 4.7-2.2 8-2.2v-14c-3.3 0-6 .6-8 2.2Z" />
        <path d="M12 6v14" />
      </svg>
    ),
  },
  {
    numeral: "II",
    title: "Gather again",
    body: "Reunions, homecomings, and virtual meetups with RSVP — Lagos or London, Houston or Ijero-Ekiti, the family always finds a table.",
    emblem: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.7 2.4 4 5.4 4 9s-1.3 6.6-4 9c-2.7-2.4-4-5.4-4-9s1.3-6.6 4-9Z" />
      </svg>
    ),
  },
  {
    numeral: "III",
    title: "Give back",
    body: "Support the school and your class projects with transparent, class-by-class giving — every naira and dollar accounted for.",
    emblem: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10Z" />
      </svg>
    ),
  },
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

  const currentYear = new Date().getFullYear();
  const years = currentYear - 1955;

  return (
    <>
      <SiteHeader />

      <main className="overflow-x-clip">
        {/* ================================================
            THE FRONTISPIECE — asymmetric hero spread
           ================================================ */}
        <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-emerald-900 text-cream">
          {/* Atmospheric wash of the entrance photograph */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.14] mix-blend-luminosity"
            style={{ backgroundImage: `url('${HERO_IMG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-900/95 to-emerald-800/70" />
          <div className="texture-diagonal absolute inset-0" />

          {/* Ghost founding year, drifting on parallax */}
          <Parallax
            speed={0.07}
            className="pointer-events-none absolute -right-8 top-4 z-0 hidden md:block"
          >
            <span className="ghost-num font-display text-[clamp(200px,28vw,400px)] font-semibold leading-none">
              1955
            </span>
          </Parallax>

          {/* Vertical archival rail */}
          <div className="absolute left-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
            <span className="h-16 w-px bg-gold-500/40" />
            <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-gold-400/80 [writing-mode:vertical-rl]">
              Ijero-Ekiti &middot; Est. MCMLV
            </span>
            <span className="h-16 w-px bg-gold-500/40" />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-16 px-6 pb-24 pt-16 md:px-12 lg:grid-cols-[7fr_5fr] lg:gap-10 lg:pb-28 lg:pt-20">
            {/* Type column */}
            <div>
              <p
                className="fade-up mb-6 flex items-center gap-4 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400"
                style={{ animationDelay: "80ms" }}
              >
                <span className="inline-block h-px w-10 bg-gold-500/70" />
                The Old Students Association
              </p>

              <h1 className="font-display text-[clamp(52px,7.4vw,104px)] font-medium leading-[0.96] tracking-[-0.02em]">
                <span className="line-mask">
                  <span className="line-rise" style={{ animationDelay: "160ms" }}>
                    Once of Doherty,
                  </span>
                </span>
                <span className="line-mask">
                  <span className="line-rise" style={{ animationDelay: "320ms" }}>
                    <em className="italic text-gold-400">forever</em> of Doherty.
                  </span>
                </span>
              </h1>

              <p
                className="fade-up mt-8 max-w-[520px] font-serif text-[17px] leading-relaxed text-cream/85 md:text-[18px]"
                style={{ animationDelay: "560ms" }}
              >
                Since 7 February 1955, the students of Ijero-Ekiti have gone out
                into the world — physicians and engineers, judges and teachers.
                This is where they find one another again: Lagos and London,
                Houston and Toronto, and every place between.
              </p>

              <div
                className="fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
                style={{ animationDelay: "720ms" }}
              >
                {approved ? (
                  <>
                    <Link href="/directory" className="btn btn-gold px-7 py-4">
                      Enter the directory
                    </Link>
                    <Link
                      href="/events"
                      className="link-underline font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-cream"
                    >
                      See events &rarr;
                    </Link>
                  </>
                ) : user ? (
                  <Link href="/pending" className="btn btn-gold px-7 py-4">
                    Your membership status
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="btn btn-gold px-7 py-4">
                      Request membership
                    </Link>
                    <Link
                      href="/login"
                      className="link-underline font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-cream"
                    >
                      Member sign in &rarr;
                    </Link>
                  </>
                )}
              </div>

              {!approved && (
                <p
                  className="fade-up mt-6 font-sans text-[12px] tracking-[0.04em] text-cream/50"
                  style={{ animationDelay: "860ms" }}
                >
                  Membership is verified by an administrator — old students only.
                </p>
              )}
            </div>

            {/* Mounted photograph — Plate I */}
            <div
              className="fade-up relative mx-auto w-full max-w-[440px] lg:mx-0"
              style={{ animationDelay: "420ms" }}
            >
              <Parallax speed={-0.045}>
                <figure className="plate-mat rotate-[1.5deg]">
                  <div className="plate-fillet">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={HERO_IMG}
                      alt="The entrance of Doherty Memorial Grammar School, Ijero-Ekiti"
                      className="animate-kenburns h-[300px] w-full object-cover sm:h-[360px]"
                    />
                  </div>
                  <figcaption className="flex items-baseline justify-between px-1 pb-1 pt-3">
                    <span className="font-display text-[15px] italic text-ink-soft">
                      Plate I &mdash; The school entrance
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-[0.24em] text-ink-muted">
                      Ijero-Ekiti, Nigeria
                    </span>
                  </figcaption>
                </figure>
              </Parallax>

              <CrestRing className="absolute -bottom-14 -left-12 hidden h-36 w-36 md:block" />
            </div>
          </div>

          {/* Scroll cue */}
          <div
            className="fade-up absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
            style={{ animationDelay: "1100ms" }}
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.34em] text-cream/50">
              The chronicle begins
            </span>
            <span className="h-8 w-px bg-gradient-to-b from-gold-400/80 to-transparent" />
          </div>
        </section>

        {/* Class-year ribbon */}
        <ClassYearRibbon />

        {/* ================================================
            THE LEDGER — ruled fact row
           ================================================ */}
        <section className="border-b border-border bg-paper px-6 md:px-12">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-4 md:divide-x md:divide-border">
            {[
              { num: `${years}`, label: "Years of legacy", note: "and counting, since 7 February 1955" },
              { num: "1955", label: "Founded", note: "by the grace of the Doherty family" },
              { num: "1967", label: "Co-educational", note: "the year the doors opened to girls" },
              { num: "III", label: "Oldest in Ekiti", note: "among the state’s first three schools" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90} className="h-full">
                <div className="flex h-full flex-col gap-2 border-t border-border py-10 pr-6 md:border-t-0 md:pl-8 md:first:pl-0">
                  <div className="font-display text-[clamp(48px,5vw,68px)] font-semibold leading-none text-emerald-900">
                    {s.num}
                  </div>
                  <div className="flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
                    <span className="inline-block h-1.5 w-1.5 bg-gold-500" />
                    {s.label}
                  </div>
                  <div className="font-serif text-[13px] italic leading-snug text-ink-muted">
                    {s.note}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================================================
            No 01 — THE CHRONICLE
           ================================================ */}
        <section className="relative overflow-hidden px-6 py-24 md:px-12 md:py-32">
          <Parallax
            speed={0.06}
            className="pointer-events-none absolute -right-16 top-10 hidden lg:block"
          >
            <span className="ghost-ink font-display text-[300px] font-semibold leading-none">
              MCMLV
            </span>
          </Parallax>

          <div className="relative mx-auto max-w-[1280px]">
            <Reveal>
              <header className="mb-16 max-w-[760px] md:mb-20">
                <p className="mb-5 flex items-center gap-4 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">
                  <span className="font-display text-[18px] normal-case italic tracking-normal">
                    &#8470;&nbsp;01
                  </span>
                  <span className="inline-block h-px w-10 bg-gold-500/60" />
                  The Chronicle
                </p>
                <h2 className="font-display text-[clamp(38px,4.6vw,64px)] font-medium leading-[1.02] tracking-[-0.01em] text-emerald-900">
                  A school raised by a family,
                  <br className="hidden sm:block" /> kept by its{" "}
                  <em className="italic text-gold-500">children</em>.
                </h2>
              </header>
            </Reveal>

            <div className="grid gap-20 lg:grid-cols-[5fr_6fr] lg:gap-16">
              {/* Plate II + archive clipping */}
              <div className="relative mx-auto w-full max-w-[460px] lg:mx-0 lg:mt-6">
                <Reveal>
                  <Parallax speed={0.05}>
                    <figure className="plate-mat -rotate-1">
                      <div className="plate-fillet">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={LIB_IMG}
                          alt="The library of Doherty Memorial Grammar School"
                          className="h-[320px] w-full object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.04] sm:h-[400px]"
                        />
                      </div>
                      <figcaption className="flex items-baseline justify-between px-1 pb-1 pt-3">
                        <span className="font-display text-[15px] italic text-ink-soft">
                          Plate II &mdash; The library
                        </span>
                        <span className="font-sans text-[9px] uppercase tracking-[0.24em] text-ink-muted">
                          DMGS campus
                        </span>
                      </figcaption>
                    </figure>
                  </Parallax>
                </Reveal>

                <Reveal delay={250}>
                  <div className="absolute -bottom-12 -right-3 max-w-[240px] rotate-2 border border-border bg-cream p-5 shadow-lg sm:-right-8">
                    <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.26em] text-gold-500">
                      From the register &middot; 1955
                    </p>
                    <p className="mt-2 font-display text-[19px] italic leading-snug text-emerald-900">
                      The first thirty students resume at Ijero-Ekiti.
                    </p>
                  </div>
                </Reveal>
              </div>

              {/* Chronicle text + annals */}
              <div className="mt-8 lg:mt-0">
                <Reveal>
                  <p className="dropcap font-serif text-[17px] leading-[1.8] text-ink-soft">
                    Doherty Memorial Grammar School was founded on 7 February
                    1955 in Ijero-Ekiti — one of the three oldest schools in
                    Ekiti State. It bears the name of the Doherty family, whose
                    children gave the funds that raised its first walls, and it
                    has carried their standard ever since.
                  </p>
                  <p className="mt-5 font-serif text-[17px] leading-[1.8] text-ink-soft">
                    Barely a year on, eight Doherty boys were chosen to meet the
                    Queen of England on her visit to Nigeria. In 1967 the school
                    opened its doors to girls, and generation after generation
                    has since gone out into medicine, engineering, law, and
                    public life across the world.
                  </p>
                </Reveal>

                {/* The annals */}
                <div className="mt-12">
                  {[
                    { year: "1955", text: "Founded on 7 February in Ijero-Ekiti, by the generosity of the Doherty family." },
                    { year: "1956", text: "Eight Doherty boys are presented to the Queen of England on her Nigerian visit." },
                    { year: "1967", text: "The school becomes co-educational, and the family grows." },
                    { year: `${currentYear}`, text: `${years} years on — old students across four continents, one register.` },
                  ].map((row, i) => (
                    <Reveal key={row.year} delay={i * 110}>
                      <div className="group grid grid-cols-[92px_1fr] items-baseline gap-5 border-t border-border py-5 last:border-b">
                        <span className="font-display text-[28px] font-semibold italic leading-none text-emerald-900 transition-colors group-hover:text-gold-500">
                          {row.year}
                        </span>
                        <span className="font-serif text-[15px] leading-relaxed text-ink-soft">
                          {row.text}
                        </span>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <Reveal delay={200}>
                  <a
                    href={`${SCHOOL}/our-school/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline mt-10 inline-block font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-emerald-900"
                  >
                    Read the full history on the school&rsquo;s site &rarr;
                  </a>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================
            THE EPIGRAPH — motto, set letterpress
           ================================================ */}
        <section className="texture-diagonal border-y border-border bg-cream-dark px-6 py-20 md:px-12 md:py-24">
          <Reveal>
            <figure className="mx-auto max-w-[880px] text-center">
              <span
                className="block font-display text-[110px] font-semibold leading-[0.4] text-gold-500/50"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <blockquote className="font-display text-[clamp(26px,3.4vw,42px)] font-medium italic leading-[1.25] text-emerald-900">
                To defend the integrity of Doherty Memorial Grammar School by
                performing extraordinary acts{" "}
                <span className="not-italic text-gold-500">extraordinarily</span>.
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-4">
                <span className="inline-block h-px w-12 bg-gold-500/60" />
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em] text-ink-muted">
                  The vision of the school
                </span>
                <span className="inline-block h-px w-12 bg-gold-500/60" />
              </figcaption>
            </figure>
          </Reveal>
        </section>

        {/* ================================================
            No 02 — THE INDEX (school links as a contents page)
           ================================================ */}
        <section className="px-6 py-24 md:px-12 md:py-32">
          <div className="mx-auto max-w-[1280px]">
            <Reveal>
              <header className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
                <div>
                  <p className="mb-5 flex items-center gap-4 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">
                    <span className="font-display text-[18px] normal-case italic tracking-normal">
                      &#8470;&nbsp;02
                    </span>
                    <span className="inline-block h-px w-10 bg-gold-500/60" />
                    The Index
                  </p>
                  <h2 className="font-display text-[clamp(34px,4vw,54px)] font-medium leading-tight text-emerald-900">
                    The school, in six doors.
                  </h2>
                </div>
                <a
                  href={SCHOOL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ink-muted hover:text-emerald-900"
                >
                  dohertyijero.com.ng
                </a>
              </header>
            </Reveal>

            <div className="border-b border-border">
              {SCHOOL_LINKS.map((l, i) => (
                <Reveal key={l.href} delay={i * 60}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-t border-border px-3 py-6 transition-colors duration-300 hover:bg-emerald-900 sm:grid-cols-[4rem_1fr_minmax(0,320px)_auto] sm:px-6 md:py-7"
                  >
                    <span className="font-sans text-[12px] tracking-[0.2em] text-gold-500 transition-colors duration-300 group-hover:text-gold-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-[clamp(24px,2.6vw,34px)] font-medium leading-none text-emerald-900 transition-colors duration-300 group-hover:text-cream">
                      {l.label}
                    </span>
                    <span className="hidden font-serif text-[14px] italic text-ink-muted transition-colors duration-300 group-hover:text-cream/70 sm:block">
                      {l.note}
                    </span>
                    <span className="justify-self-end font-sans text-[18px] text-gold-500 transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-gold-400">
                      &rarr;
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================
            No 03 — THE FELLOWSHIP (stepped, asymmetric)
           ================================================ */}
        <section className="relative overflow-hidden border-t border-border bg-cream px-6 py-24 md:px-12 md:py-32">
          <Parallax
            speed={0.05}
            className="pointer-events-none absolute -left-10 bottom-0 hidden lg:block"
          >
            <span className="ghost-ink font-display text-[260px] font-semibold leading-none">
              OSA
            </span>
          </Parallax>

          <div className="relative mx-auto max-w-[1280px]">
            <Reveal>
              <header className="mb-16 max-w-[640px] md:mb-24">
                <p className="mb-5 flex items-center gap-4 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">
                  <span className="font-display text-[18px] normal-case italic tracking-normal">
                    &#8470;&nbsp;03
                  </span>
                  <span className="inline-block h-px w-10 bg-gold-500/60" />
                  The Fellowship
                </p>
                <h2 className="font-display text-[clamp(34px,4vw,54px)] font-medium leading-tight text-emerald-900">
                  What membership{" "}
                  <em className="italic text-gold-500">holds</em>.
                </h2>
              </header>
            </Reveal>

            <div className="grid gap-14 md:grid-cols-3 md:gap-10">
              {FELLOWSHIP.map((f, i) => (
                <Reveal
                  key={f.title}
                  delay={i * 130}
                  className={i === 1 ? "md:mt-16" : i === 2 ? "md:mt-32" : ""}
                >
                  <article className="group relative border-t-2 border-emerald-900 pt-7">
                    <span
                      className="ghost-ink pointer-events-none absolute -top-2 right-0 font-display text-[88px] font-semibold leading-none"
                      aria-hidden="true"
                    >
                      {f.numeral}
                    </span>
                    <span className="mb-6 inline-flex text-gold-500 transition-transform duration-500 group-hover:-translate-y-1">
                      {f.emblem}
                    </span>
                    <h3 className="mb-4 font-display text-[28px] font-semibold leading-tight text-emerald-900">
                      {f.title}
                    </h3>
                    <p className="max-w-[320px] font-serif text-[15px] leading-[1.75] text-ink-soft">
                      {f.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================
            THE SEAL — closing invitation
           ================================================ */}
        {!approved ? (
          <section className="relative overflow-hidden bg-emerald-900 px-6 py-24 text-cream md:px-12 md:py-32">
            <div className="texture-diagonal absolute inset-0" />
            {/* Framed border, like a certificate */}
            <div className="pointer-events-none absolute inset-4 border border-gold-500/25 md:inset-6" />
            <div className="pointer-events-none absolute inset-6 border border-gold-500/50 md:inset-8" />

            <Reveal>
              <div className="relative mx-auto max-w-[720px] text-center">
                <p className="mb-6 font-sans text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">
                  Doherty Memorial Grammar School &middot; OSA
                </p>
                <h2 className="font-display text-[clamp(38px,5vw,64px)] font-medium leading-[1.02]">
                  Take your place in{" "}
                  <em className="italic text-gold-400">the register</em>.
                </h2>
                <p className="mx-auto mt-6 max-w-[460px] font-serif text-[17px] italic leading-relaxed text-cream/80">
                  Request your membership today — an administrator will verify
                  your class and welcome you back into the family.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                  <Link
                    href={user ? "/pending" : "/signup"}
                    className="btn btn-gold px-8 py-4"
                  >
                    {user ? "Your membership status" : "Request membership"}
                  </Link>
                  {!user && (
                    <Link
                      href="/login"
                      className="link-underline font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-cream"
                    >
                      Member sign in &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          </section>
        ) : (
          <section className="relative overflow-hidden bg-emerald-900 px-6 py-16 text-cream md:px-12">
            <div className="texture-diagonal absolute inset-0" />
            <Reveal>
              <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6">
                <h2 className="font-display text-[clamp(26px,3vw,38px)] font-medium leading-tight">
                  Welcome back, <em className="italic text-gold-400">old student</em>.
                </h2>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <Link href="/directory" className="btn btn-gold">
                    Enter the directory
                  </Link>
                  <Link
                    href="/events"
                    className="link-underline font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-cream"
                  >
                    See events &rarr;
                  </Link>
                </div>
              </div>
            </Reveal>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
