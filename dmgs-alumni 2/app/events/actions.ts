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

  const { error } = await supabase.from("events").insert({
    title,
    description: clean(formData.get("description")),
    format: (clean(formData.get("format")) ?? "in_person") as
      | "in_person"
      | "virtual"
      | "hybrid",
    starts_at: new Date(startsRaw).toISOString(),
    ends_at: (() => {
      const e = clean(formData.get("ends_at"));
      return e ? new Date(e).toISOString() : null;
    })(),
    location: clean(formData.get("location")),
    zoom_url: clean(formData.get("zoom_url")),
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/events");
  return { message: "Event created." };
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
  return { message: going ? "You're going!" : "RSVP removed." };
}
