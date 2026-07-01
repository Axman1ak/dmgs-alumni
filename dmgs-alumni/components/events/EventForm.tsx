"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { createEvent, type EventState } from "@/app/events/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: EventState = {};

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
      <button onClick={() => setOpen(true)} className="btn btn-gold">
        + New event
      </button>
    );
  }

  return (
    <div className="border border-border bg-cream p-7">
      <h3 className="mb-5 font-display text-[24px] font-semibold text-emerald-900">
        Create an event
      </h3>
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
      <form action={action}>
        <div className="mb-5">
          <label className="field-label" htmlFor="title">Title</label>
          <input id="title" name="title" required className="field-input" />
        </div>
        <div className="mb-5">
          <label className="field-label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="field-input" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="format">Format</label>
            <select id="format" name="format" className="field-input">
              <option value="in_person">In person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="location">Location</label>
            <input id="location" name="location" className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="starts_at">Starts</label>
            <input id="starts_at" name="starts_at" type="datetime-local" required className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="ends_at">Ends (optional)</label>
            <input id="ends_at" name="ends_at" type="datetime-local" className="field-input" />
          </div>
        </div>
        <div className="mb-5 mt-5">
          <label className="field-label" htmlFor="zoom_url">Join link (for virtual / hybrid)</label>
          <input id="zoom_url" name="zoom_url" type="url" placeholder="https://…" className="field-input" />
        </div>
        <div className="flex gap-3">
          <SubmitButton>Create event</SubmitButton>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
