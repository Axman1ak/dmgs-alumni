"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { EventEditForm } from "./EventForm";
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

export type Attendee = { name: string; classYear: number | null; email: string | null };

function downloadCsv(event: AlumniEvent, people: Attendee[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["Name", "Class", "Email"], ...people.map((p) => [p.name, p.classYear ? String(p.classYear) : "", p.email ?? ""])];
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EventCard({
  event,
  attendeeCount,
  isGoing,
  canManage,
  past = false,
  attendees,
}: {
  event: AlumniEvent;
  attendeeCount: number;
  isGoing: boolean;
  canManage: boolean;
  past?: boolean;
  attendees?: Attendee[];
}) {
  const [editing, setEditing] = useState(false);
  const [showList, setShowList] = useState(false);
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
        {canManage && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", fontSize: 14 }}>
            <button type="button" className="m-link" style={{ fontSize: 14 }} onClick={() => setShowList((v) => !v)} aria-expanded={showList}>
              {showList ? "Hide list" : `Who's coming (${attendees?.length ?? attendeeCount})`}
            </button>
            {!cancelled && (
              <button type="button" className="m-link" style={{ fontSize: 14 }} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
                {editing ? "Close editor" : "Edit"}
              </button>
            )}
            {!cancelled && !past && (
              <form action={cancelAction}>
                <input type="hidden" name="event_id" value={event.id} />
                <Pending idle="Cancel event" busy="Cancelling…" className="m-link m-danger-link" />
              </form>
            )}
          </div>
        )}
      </div>
      {canManage && showList && (
        <div className="m-ev-list">
          {(attendees ?? []).length === 0 ? (
            <p style={{ color: "var(--m-muted)" }}>Nobody has said they are coming yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <b>{attendees!.length} {attendees!.length === 1 ? "person" : "people"} coming</b>
                <button type="button" className="m-btn m-btn-line m-btn-sm" onClick={() => downloadCsv(event, attendees!)}>
                  Download CSV
                </button>
              </div>
              <table className="m-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees!.map((a, i) => (
                    <tr key={i}>
                      <td>{a.name}</td>
                      <td>{a.classYear ?? "–"}</td>
                      <td>{a.email ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
      {canManage && editing && <EventEditForm event={event} onDone={() => setEditing(false)} />}
    </article>
  );
}
