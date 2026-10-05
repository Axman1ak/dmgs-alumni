import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { CountUp } from "@/components/landing/CountUp";
import { ClassFinder } from "@/components/landing/ClassFinder";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Completed works shown on the public page (photos from the school's
// "Then & Now" posts). Confirm with the association which ones it funded.
const WORK = [
  { tag: "Classrooms", title: "The four-classroom block, rebuilt", body: "New roofing, windows, doors, ceilings and terrazzo floors for a block that had fallen out of use.", before: "/img/class-before.jpg", after: "/img/class-after.jpg" },
  { tag: "Clean water", title: "A borehole and water tower", body: "Water drilled on campus and piped to the buildings that need it most.", before: "/img/water-before.jpg", after: "/img/water-after.jpg" },
  { tag: "Staff housing", title: "The principal's house, renovated", body: "Restored and connected to running water, so staff can live and supervise on campus.", before: "/img/house-before.jpg", after: "/img/house-after.jpg" },
];

const WAYS = [
  ["Find your classmates", "Search the members directory by class, city or profession."],
  ["Support a project", "Give to classrooms, clean water or staff housing."],
  ["Pay your class dues", "Help your graduating class reach its annual goal."],
  ["Attend a reunion", "Class meetings and association events, in person and online."],
];

const ARROW = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f6a52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let approved = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("status").eq("id", user.id).single();
    approved = data?.status === "approved";
  }

  const [{ data: stats }, { data: counts }] = await Promise.all([
    supabase.rpc("public_register_stats"),
    supabase.rpc("public_class_counts"),
  ]);
  const onRegister = stats?.[0]?.on_register ?? 0;
  const classes = stats?.[0]?.classes ?? 0;

  const joinHref = approved ? "/home" : "/signup";
  const joinLabel = approved ? "Go to the member area" : "Become a member";

  return (
    <>
      <SiteHeader />
      <main className="m-app ld">
        {/* HERO */}
        <section className="ld-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/hero.jpg" alt="Doherty students choosing books in the school library" />
          <div className="m-wrap">
            <div className="ld-copy">
              <span className="ld-kicker">Old Students Association</span>
              <h1>Giving back to the school that shaped us.</h1>
              <p>We connect the old students of Doherty Memorial Grammar School and fund the repairs the school cannot wait for.</p>
              <div className="ld-ctas">
                <Link className="m-btn m-btn-gold" href={joinHref}>{joinLabel}</Link>
                <a className="m-btn m-btn-ghost" href="#work">See our work</a>
              </div>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="ld-intro">
          <div className="m-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/crest.png" alt="" width={64} height={64} />
            <p>Since 1955, Doherty has sent its students into medicine, engineering, law and public life across the world. Today, its old students are returning the favour.</p>
            <a className="m-link ld-underline" href="#school">About the association</a>
          </div>
        </section>

        {/* OUR WORK */}
        <section className="m-wrap ld-work" id="work">
          <div className="m-rule-h">
            <h2>Our work on campus</h2>
            <Link className="m-link" href={approved ? "/donations" : "/signup"}>All projects →</Link>
          </div>
          <div className="ld-grid3">
            {WORK.map((w) => (
              <article key={w.title} className="ld-wcard ld-reveal">
                <BeforeAfter before={w.before} after={w.after} label={w.title} />
                <span className="ld-hint">Drag the handle to compare</span>
                <span className="m-eyebrow">{w.tag}</span>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ACCOUNTABILITY */}
        <section className="ld-acct" id="accountability">
          <div className="m-wrap">
            <div className="left">
              <span className="m-eyebrow" style={{ color: "var(--m-gold)" }}>Accountability</span>
              <h2>Every project publishes its budget. Every donor receives the receipts.</h2>
            </div>
            <div className="ld-stats m-num">
              <div><span className="v"><CountUp value={onRegister} /></span><span className="l">Old students on the register</span></div>
              <div><span className="v"><CountUp value={classes} /></span><span className="l">Graduating classes represented</span></div>
              <div><span className="v"><CountUp value={WORK.length} /></span><span className="l">Campus projects completed</span></div>
            </div>
          </div>
        </section>

        {/* PHOTO + QUOTE */}
        <section className="ld-quote" id="school">
          <div className="ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/gate.jpg" alt="The main gate of Doherty Memorial Grammar School, Ijero-Ekiti" loading="lazy" />
          </div>
          <div className="tx">
            <span className="mark" aria-hidden="true">“</span>
            <p>To defend the integrity of Doherty Memorial Grammar School by performing extraordinary acts extraordinarily.</p>
            <small>The charge given to every Doherty student</small>
          </div>
        </section>

        {/* GET INVOLVED */}
        <section className="ld-involved">
          <div className="m-wrap">
            <div className="left">
              <h2>Get involved</h2>
              <p>Membership is free and open to every old student. An administrator verifies each request before access is granted.</p>
            </div>
            <div className="ld-ways">
              {WAYS.map(([t, b]) => (
                <Link key={t} className="ld-reveal" href={joinHref}>
                  <span>
                    <h3>{t}</h3>
                    <p>{b}</p>
                  </span>
                  {ARROW}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* JOIN */}
        <section className="ld-join" id="join">
          <div className="m-wrap">
            <div className="left">
              <h2>Are you a Doherty old student?</h2>
              <p>
                {onRegister} old students from {classes} graduating classes are already listed in our register. Your name may be one of them.
              </p>
              <ClassFinder counts={(counts ?? []) as { class_year: number; people: number }[]} />
            </div>
            <div className="ld-ctas">
              {approved ? (
                <Link className="m-btn m-btn-primary" href="/home">Go to the member area</Link>
              ) : (
                <>
                  <Link className="m-btn m-btn-primary" href="/signup">Request membership</Link>
                  <Link className="m-btn m-btn-line" href="/login">Sign in</Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
