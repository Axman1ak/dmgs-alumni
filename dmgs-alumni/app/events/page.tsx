import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { EventCard } from "@/components/events/EventCard";
import { EventForm } from "@/components/events/EventForm";
import { createClient } from "@/lib/supabase/server";
import type { AlumniEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: events }, { data: rsvps }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
      supabase
        .from("events")
        .select(
          "id, title, description, format, starts_at, ends_at, location, zoom_url, status",
        )
        .order("starts_at", { ascending: true }),
      supabase.from("event_rsvps").select("event_id, profile_id"),
    ]);

  const canManage = profile?.role === "super_admin";
  const rows = (events ?? []) as AlumniEvent[];

  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of rsvps ?? []) {
    counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
    if (r.profile_id === user?.id) mine.add(r.event_id);
  }

  const now = Date.now();
  const upcoming = rows.filter(
    (e) => new Date(e.starts_at).getTime() >= now && e.status === "scheduled",
  );
  const past = rows.filter(
    (e) => new Date(e.starts_at).getTime() < now || e.status === "cancelled",
  );

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="texture-diagonal bg-emerald-900 px-5 sm:px-8 pb-12 pt-16 text-cream">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.24em] text-gold-400">
                Gather again
              </p>
              <h1 className="font-display text-[34px] font-medium leading-none sm:text-[54px]">
                Events &amp; Reunions
              </h1>
              <p className="mt-3 max-w-[480px] font-serif text-[17px] italic opacity-85">
                Reunions, virtual meetups, and homecomings, wherever in the
                world you are.
              </p>
            </div>
            {canManage && <EventForm />}
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 py-12">
          <section className="mb-14">
            <h2 className="mb-6 border-b border-border pb-3 font-display text-[28px] font-medium text-emerald-900">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="py-12 text-center font-sans text-[14px] text-ink-muted">
                No upcoming events yet.
                {canManage && " Create one with the button above."}
              </p>
            ) : (
              <div className="grid gap-6">
                {upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    attendeeCount={counts.get(e.id) ?? 0}
                    isGoing={mine.has(e.id)}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-6 border-b border-border pb-3 font-display text-[28px] font-medium text-emerald-900">
                Past &amp; cancelled
              </h2>
              <div className="grid gap-6">
                {past.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    attendeeCount={counts.get(e.id) ?? 0}
                    isGoing={mine.has(e.id)}
                    canManage={canManage}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
