"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { createEvent, updateEvent, type EventState } from "@/app/events/actions";
import type { AlumniEvent } from "@/lib/types";

const initial: EventState = {};

/** ISO → value for <input type="datetime-local">, in the browser's timezone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (read in the browser's timezone) → ISO. */
function toIso(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="m-btn m-btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

function Fields({ event, onCancel }: { event?: AlumniEvent; onCancel: () => void }) {
  const [starts, setStarts] = useState(() => toLocalInput(event?.starts_at));
  const [ends, setEnds] = useState(() => toLocalInput(event?.ends_at));
  const [tz, setTz] = useState("");
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      {event && <input type="hidden" name="event_id" value={event.id} />}
      <input type="hidden" name="starts_iso" value={toIso(starts)} />
      <input type="hidden" name="ends_iso" value={toIso(ends)} />
      <div className="m-field full">
        <label htmlFor={`title-${event?.id ?? "new"}`}>Title</label>
        <input id={`title-${event?.id ?? "new"}`} name="title" required className="m-input" defaultValue={event?.title ?? ""} />
      </div>
      <div className="m-field full">
        <label htmlFor={`desc-${event?.id ?? "new"}`}>Description</label>
        <textarea
          id={`desc-${event?.id ?? "new"}`}
          name="description"
          rows={3}
          className="m-input"
          style={{ height: "auto", padding: 12 }}
          defaultValue={event?.description ?? ""}
        />
      </div>
      <div className="m-field">
        <label htmlFor={`fmt-${event?.id ?? "new"}`}>Format</label>
        <select id={`fmt-${event?.id ?? "new"}`} name="format" className="m-input" defaultValue={event?.format ?? "in_person"}>
          <option value="in_person">In person</option>
          <option value="virtual">Online</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="m-field">
        <label htmlFor={`loc-${event?.id ?? "new"}`}>Location</label>
        <input id={`loc-${event?.id ?? "new"}`} name="location" className="m-input" defaultValue={event?.location ?? ""} />
      </div>
      <div className="m-field">
        <label htmlFor={`st-${event?.id ?? "new"}`}>Starts</label>
        <input
          id={`st-${event?.id ?? "new"}`}
          name="starts_at"
          type="datetime-local"
          required
          className="m-input"
          value={starts}
          onChange={(e) => setStarts(e.target.value)}
        />
      </div>
      <div className="m-field">
        <label htmlFor={`en-${event?.id ?? "new"}`}>Ends (optional)</label>
        <input
          id={`en-${event?.id ?? "new"}`}
          name="ends_at"
          type="datetime-local"
          className="m-input"
          value={ends}
          onChange={(e) => setEnds(e.target.value)}
        />
      </div>
      <span className="m-hint full">
        Enter times in your own timezone{tz ? ` (${tz})` : ""}. Members see them in Lagos time (WAT).
      </span>
      <div className="m-field full">
        <label htmlFor={`url-${event?.id ?? "new"}`}>Join link (online or hybrid)</label>
        <input
          id={`url-${event?.id ?? "new"}`}
          name="zoom_url"
          type="url"
          placeholder="https://…"
          className="m-input"
          defaultValue={event?.zoom_url ?? ""}
        />
      </div>
      <div className="full" style={{ display: "flex", gap: 12 }}>
        <Submit label={event ? "Save changes" : "Create event"} />
        <button type="button" onClick={onCancel} className="m-btn m-btn-line">
          Cancel
        </button>
      </div>
    </>
  );
}

/** Super-admin-only "create event" panel, collapsed by default. */
export function EventForm() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setOpen(true)} className="m-btn m-btn-gold">
          New event
        </button>
      </div>
    );
  }
  // Mounted fresh each time it opens, so a previous "created" result never
  // closes it straight away.
  return <CreatePanel onDone={() => setOpen(false)} />;
}

function CreatePanel({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [state, action] = useFormState(createEvent, initial);

  useEffect(() => {
    if (state.message) {
      onDone();
      router.refresh();
    }
  }, [state, router, onDone]);

  return (
    <section className="m-card">
      <div style={{ padding: "22px 28px 0" }}>
        <h2 style={{ fontSize: 24, color: "var(--m-emerald)" }}>Create an event</h2>
      </div>
      <form action={action} className="m-form">
        {state.error && <p className="m-error full">{state.error}</p>}
        <Fields onCancel={onDone} />
      </form>
    </section>
  );
}

/** Inline edit form for one event (super admins). */
export function EventEditForm({ event, onDone }: { event: AlumniEvent; onDone: () => void }) {
  const router = useRouter();
  const [state, action] = useFormState(updateEvent, initial);

  useEffect(() => {
    if (state.message) {
      onDone();
      router.refresh();
    }
  }, [state, router, onDone]);

  return (
    <form action={action} className="m-form" style={{ borderTop: "1px solid var(--m-line)", gridColumn: "1 / -1" }}>
      {state.error && <p className="m-error full">{state.error}</p>}
      <Fields event={event} onCancel={onDone} />
    </form>
  );
}
