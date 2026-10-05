"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { AlumniEvent } from "@/lib/types";
import { rsvp, cancelEvent, type EventState } from "@/app/events/actions";

const initial: EventState = {};

const FORMAT_LABEL: Record<AlumniEvent["format"], string> = {
  in_person: "In person",
  virtual: "Online",
  hybrid: "Hybrid",
};

// Format in a fixed timezone (WAT, Nigeria) so server-rendered HTML matches the
// client render regardless of the viewer's locale.
const TZ = "Africa/Lagos";

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: TZ }).toUpperCase(),
    day: Number(d.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ })),
    year: Number(d.toLocaleDateString("en-US", { year: "numeric", timeZone: TZ })),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }),
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ }),
  };
}

function Pending({ idle, busy, className }: { idle: string; busy: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? busy : idle}
    </button>
  );
}

export function EventCard({
  event,
  attendeeCount,
  isGoing,
  canManage,
  past = false,
}: {
  event: AlumniEvent;
  attendeeCount: number;
  isGoing: boolean;
  canManage: boolean;
  past?: boolean;
}) {
  const [rsvpState, rsvpAction] = useFormState(rsvp, initial);
  const [cancelState, cancelAction] = useFormState(cancelEvent, initial);
  const d = dateParts(event.starts_at);
  const cancelled = event.status === "cancelled";
  const others = Math.max(0, attendeeCount - (isGoing ? 1 : 0));

  return (
    <article className={`m-card m-ev ${past || cancelled ? "past" : ""}`}>
      <div className="d">
        <span className="mo">{d.month}</span>
        <span className="n">{d.day}</span>
        <span className="w">{d.year}</span>
      </div>
      <div className="i">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="m-fmt">{FORMAT_LABEL[event.format]}</span>
          <span style={{ fontSize: 13, color: "var(--m-muted)" }}>
            {d.weekday} · {d.time} WAT
          </span>
          {cancelled && (
            <span className="m-pill" style={{ color: "#8a2a2a" }}>
              <span className="m-dot" />
              Cancelled
            </span>
          )}
        </div>
        <h2>{event.title}</h2>
        {event.location && <span style={{ color: "#4d5358", fontSize: 15 }}>{event.location}</span>}
        {event.description && <p className="desc">{event.description}</p>}
        {(rsvpState.error || cancelState.error) && <p className="m-error">{rsvpState.error || cancelState.error}</p>}
      </div>
      <div className="r">
        <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
          {isGoing
            ? others > 0
              ? `You and ${others} ${others === 1 ? "other" : "others"} ${past ? "went" : "are going"}`
              : past ? "You went" : "You are going"
            : `${attendeeCount} ${past ? "went" : "going"}`}
        </span>
        {!cancelled && !past && (
          <form action={rsvpAction}>
            <input type="hidden" name="event_id" value={event.id} />
            <input type="hidden" name="going" value={(!isGoing).toString()} />
            <Pending
              idle={isGoing ? "Going ✓" : "I'll attend"}
              busy="Saving…"
              className={`m-btn m-btn-block ${isGoing ? "m-btn-line" : "m-btn-primary"}`}
            />
          </form>
        )}
        {!cancelled && !past && event.zoom_url && event.format !== "in_person" && (
          <a href={event.zoom_url} target="_blank" rel="noopener noreferrer" className="m-link" style={{ fontSize: 14 }}>
            Join link
          </a>
        )}
        {canManage && !cancelled && !past && (
          <form action={cancelAction} style={{ color: "#8a2a2a" }}>
            <input type="hidden" name="event_id" value={event.id} />
            <Pending idle="Cancel event" busy="Cancelling…" className="m-link" />
          </form>
        )}
      </div>
    </article>
  );
}
