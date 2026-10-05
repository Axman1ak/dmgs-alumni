"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { createEvent, type EventState } from "@/app/events/actions";

const initial: EventState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="m-btn m-btn-primary">
      {pending ? "Saving…" : "Create event"}
    </button>
  );
}

/** Super-admin-only "create event" panel, collapsed by default. */
export function EventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createEvent, initial);

  useEffect(() => {
    if (state.message) {
      setOpen(false);
      router.refresh();
    }
  }, [state.message, router]);

  if (!open) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setOpen(true)} className="m-btn m-btn-gold">
          New event
        </button>
      </div>
    );
  }

  return (
    <section className="m-card">
      <div style={{ padding: "22px 28px 0" }}>
        <h2 style={{ fontSize: 24, color: "var(--m-emerald)" }}>Create an event</h2>
      </div>
      <form action={action} className="m-form">
        {state.error && <p className="m-error full">{state.error}</p>}
        <div className="m-field full">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required className="m-input" />
        </div>
        <div className="m-field full">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="m-input" style={{ height: "auto", padding: 12 }} />
        </div>
        <div className="m-field">
          <label htmlFor="format">Format</label>
          <select id="format" name="format" className="m-input">
            <option value="in_person">In person</option>
            <option value="virtual">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="m-field">
          <label htmlFor="location">Location</label>
          <input id="location" name="location" className="m-input" />
        </div>
        <div className="m-field">
          <label htmlFor="starts_at">Starts (Lagos time)</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required className="m-input" />
        </div>
        <div className="m-field">
          <label htmlFor="ends_at">Ends (optional)</label>
          <input id="ends_at" name="ends_at" type="datetime-local" className="m-input" />
        </div>
        <div className="m-field full">
          <label htmlFor="zoom_url">Join link (online or hybrid)</label>
          <input id="zoom_url" name="zoom_url" type="url" placeholder="https://…" className="m-input" />
        </div>
        <div className="full" style={{ display: "flex", gap: 12 }}>
          <Submit />
          <button type="button" onClick={() => setOpen(false)} className="m-btn m-btn-line">
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
