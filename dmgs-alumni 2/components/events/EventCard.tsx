"use client";

import { useFormState } from "react-dom";
import type { AlumniEvent } from "@/lib/types";
import { rsvp, cancelEvent, type EventState } from "@/app/events/actions";

const initial: EventState = {};

const FORMAT_LABEL: Record<AlumniEvent["format"], string> = {
  in_person: "In person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    year: d.getFullYear(),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

export function EventCard({
  event,
  attendeeCount,
  isGoing,
  canManage,
}: {
  event: AlumniEvent;
  attendeeCount: number;
  isGoing: boolean;
  canManage: boolean;
}) {
  const [rsvpState, rsvpAction] = useFormState(rsvp, initial);
  const [cancelState, cancelAction] = useFormState(cancelEvent, initial);
  const d = dateParts(event.starts_at);
  const cancelled = event.status === "cancelled";

  return (
    <div
      className={`grid grid-cols-[110px_1fr] overflow-hidden border border-border bg-cream transition-shadow hover:shadow-soft ${
        cancelled ? "opacity-60" : ""
      }`}
    >
      {/* Date block */}
      <div className="flex flex-col justify-center border-r-4 border-gold-500 bg-emerald-900 px-3 py-6 text-center text-cream">
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold-400">
          {d.month}
        </span>
        <span className="my-1 font-display text-5xl font-medium leading-none">
          {d.day}
        </span>
        <span className="font-sans text-[11px] tracking-[0.08em] opacity-70">
          {d.year}
        </span>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span
            className={`inline-block px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] ${
              event.format === "in_person"
                ? "bg-emerald-800 text-gold-400"
                : event.format === "virtual"
                  ? "bg-gold-500/15 text-gold-500"
                  : "bg-emerald-700/15 text-emerald-800"
            }`}
          >
            {FORMAT_LABEL[event.format]}
          </span>
          {cancelled && (
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-danger">
              Cancelled
            </span>
          )}
        </div>

        <h3 className="mb-2 font-display text-[26px] font-semibold text-emerald-900">
          {event.title}
        </h3>

        <div className="mb-3 flex flex-wrap gap-4 font-sans text-[12px] tracking-[0.04em] text-ink-muted">
          <span>
            {d.weekday}, {d.time}
          </span>
          {event.location && <span>{event.location}</span>}
          <span>
            {attendeeCount} {attendeeCount === 1 ? "attending" : "attending"}
          </span>
        </div>

        {event.description && (
          <p className="mb-4 text-[15px] leading-relaxed text-ink-soft">
            {event.description}
          </p>
        )}

        {(rsvpState.error || cancelState.error) && (
          <p className="mb-3 font-sans text-[12px] text-danger">
            {rsvpState.error || cancelState.error}
          </p>
        )}

        {!cancelled && (
          <div className="flex flex-wrap items-center gap-3">
            <form action={rsvpAction}>
              <input type="hidden" name="event_id" value={event.id} />
              <input type="hidden" name="going" value={(!isGoing).toString()} />
              <button
                type="submit"
                className={isGoing ? "btn btn-outline" : "btn btn-primary"}
              >
                {isGoing ? "Cancel RSVP" : "RSVP, I'll be there"}
              </button>
            </form>

            {event.zoom_url && (event.format === "virtual" || event.format === "hybrid") && (
              <a
                href={event.zoom_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
              >
                Join link
              </a>
            )}

            {canManage && (
              <form action={cancelAction} className="ml-auto">
                <input type="hidden" name="event_id" value={event.id} />
                <button type="submit" className="btn btn-danger">
                  Cancel event
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
