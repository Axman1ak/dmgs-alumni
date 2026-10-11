import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { EventCard } from "@/components/events/EventCard";
import { EventForm } from "@/components/events/EventForm";
import { createClient } from "@/lib/supabase/server";
import type { AlumniEvent } from "@/lib/types";
import type { Attendee } from "@/components/events/EventCard";
import { isUpcoming } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const showPast = searchParams.tab === "past";
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

  // Super admins and class admins create, edit and cancel events.
  const canManage = profile?.role === "super_admin" || profile?.role === "class_admin";
  const rows = (events ?? []) as AlumniEvent[];

  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of rsvps ?? []) {
    counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
    if (r.profile_id === user?.id) mine.add(r.event_id);
  }

  const upcoming = rows.filter((e) => isUpcoming(e));
  const past = rows.filter((e) => !isUpcoming(e));

  // Attendee lists, for super admins only.
  const attendeesByEvent = new Map<string, Attendee[]>();
  if (canManage) {
    // Names, class and email come from a database function that only event
    // managers may call (members can't read each other's emails).
    const withRsvps = rows.filter((e) => (counts.get(e.id) ?? 0) > 0);
    const lists = await Promise.all(withRsvps.map((e) => supabase.rpc("event_attendees", { p_event: e.id })));
    withRsvps.forEach((e, i) => {
      const data = (lists[i].data ?? []) as { name: string; class_year: number | null; email: string | null }[];
      attendeesByEvent.set(
        e.id,
        data.map((d) => ({ name: d.name ?? "Member", classYear: d.class_year, email: d.email })),
      );
    });
  }

  past.reverse(); // most recent first
  const list = showPast ? past : upcoming;

  return (
    <>
      <SiteHeader />
      <main className="m-app">
        <section className="m-page-head tabs">
          <div className="m-wrap">
            <h1>Events</h1>
            <div className="m-tablist" role="tablist">
              <Link href="/events" role="tab" aria-selected={!showPast}>
                Upcoming <span className="c">{upcoming.length}</span>
              </Link>
              <Link href="/events?tab=past" role="tab" aria-selected={showPast}>
                Past <span className="c">{past.length}</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="m-wrap m-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {canManage && !showPast && <EventForm />}
          {list.length === 0 ? (
            <div className="m-card m-empty">
              {showPast ? "No past events yet." : "No upcoming events yet."}
              {canManage && !showPast && " Create one with the button above."}
            </div>
          ) : (
            list.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                attendeeCount={counts.get(e.id) ?? 0}
                isGoing={mine.has(e.id)}
                canManage={canManage}
                past={showPast}
                attendees={canManage ? attendeesByEvent.get(e.id) ?? [] : undefined}
              />
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
