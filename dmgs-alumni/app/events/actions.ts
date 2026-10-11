"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventState = { error?: string; message?: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function clean(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** Create an event. RLS restricts INSERT to super admins. */
export async function createEvent(
  _prev: EventState,
  formData: FormData,
): Promise<EventState> {
  const { supabase, user } = await requireUser();

  const title = clean(formData.get("title"));
  const startsRaw = clean(formData.get("starts_at"));
  if (!title || !startsRaw) {
    return { error: "Title and start date/time are required." };
  }

  const fields = eventFields(formData);
  if ("error" in fields) return fields;

  const { error } = await supabase.from("events").insert({ ...fields, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath("/events");
  revalidatePath("/home");
  return { message: "Event created." };
}

/** Edit an event. RLS restricts UPDATE to super admins. */
export async function updateEvent(
  _prev: EventState,
  formData: FormData,
): Promise<EventState> {
  const { supabase } = await requireUser();
  const id = clean(formData.get("event_id"));
  if (!id) return { error: "Missing event." };
  const title = clean(formData.get("title"));
  const startsRaw = clean(formData.get("starts_at"));
  if (!title || !startsRaw) return { error: "Title and start date/time are required." };

  const fields = eventFields(formData);
  if ("error" in fields) return fields;

  const { data, error } = await supabase.from("events").update(fields).eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "You are not allowed to edit this event." };

  revalidatePath("/events");
  revalidatePath("/home");
  return { message: "Event updated." };
}

/**
 * Shared field parsing. The browser sends each time twice: the raw
 * datetime-local value and an ISO version converted in the admin's own
 * timezone (starts_iso / ends_iso). The ISO one wins; the raw value is a
 * fallback read as Lagos time (WAT, UTC+1).
 */
function eventFields(formData: FormData) {
  const lagos = (v: string) => new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00+01:00` : v);
  const when = (iso: string | null, raw: string | null) => {
    if (iso && !Number.isNaN(Date.parse(iso))) return new Date(iso).toISOString();
    if (raw) {
      const d = lagos(raw);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  };
  const starts_at = when(clean(formData.get("starts_iso")), clean(formData.get("starts_at")));
  if (!starts_at) return { error: "Please enter a valid start date and time." } as const;
  const ends_at = when(clean(formData.get("ends_iso")), clean(formData.get("ends_at")));
  if (ends_at && ends_at < starts_at) return { error: "The end time is before the start time." } as const;
  const formatRaw = clean(formData.get("format"));
  const format = (formatRaw && ["in_person", "virtual", "hybrid"].includes(formatRaw) ? formatRaw : "in_person") as
    | "in_person"
    | "virtual"
    | "hybrid";
  return {
    title: clean(formData.get("title"))!,
    description: clean(formData.get("description")),
    format,
    starts_at,
    ends_at,
    location: clean(formData.get("location")),
    zoom_url: clean(formData.get("zoom_url")),
  };
}

/** Cancel (soft) an event. Super admin only via RLS. */
export async function cancelEvent(
  _prev: EventState,
  formData: FormData,
): Promise<EventState> {
  const { supabase } = await requireUser();
  const id = clean(formData.get("event_id"));
  if (!id) return { error: "Missing event." };

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/events");
  revalidatePath("/home");
  return { message: "Event cancelled." };
}

/** Toggle the caller's RSVP for an event. */
export async function rsvp(
  _prev: EventState,
  formData: FormData,
): Promise<EventState> {
  const { supabase, user } = await requireUser();
  const eventId = clean(formData.get("event_id"));
  const going = clean(formData.get("going")) === "true";

  if (!eventId) return { error: "Missing event." };

  if (going) {
    const { error } = await supabase
      .from("event_rsvps")
      .upsert(
        { event_id: eventId, profile_id: user.id, status: "going" },
        { onConflict: "event_id,profile_id" },
      );
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", user.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/events");
  revalidatePath("/home");
  return { message: going ? "You're going!" : "RSVP removed." };
}

/** Plain form-action version of rsvp, for one-click buttons (Home page). */
export async function rsvpToggle(formData: FormData): Promise<void> {
  await rsvp({}, formData);
}
