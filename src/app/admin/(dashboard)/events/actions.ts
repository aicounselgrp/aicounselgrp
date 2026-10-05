"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/dal";
import { createEvent, updateEvent, type EventInput } from "@/lib/events";
import { eventLocalToIso } from "@/lib/event-time";

// On an error the submitted values are sent back, because React resets the
// form after an action and the admin would otherwise lose what they typed.
export type EventFormState = {
  ok: boolean;
  message: string;
  values?: { title: string; description: string; location: string; eventAt: string; endsAt: string };
} | null;

function submittedValues(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");
  return {
    title: text("title"),
    description: text("description"),
    location: text("location"),
    eventAt: text("eventAt"),
    endsAt: text("endsAt"),
  };
}

// Start/end are datetime-local values entered in Eastern Time.
function parseEventForm(formData: FormData): EventInput | string {
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const title = text("title");
  if (!title) return "Title is required.";

  const startRaw = text("eventAt");
  const endRaw = text("endsAt");
  const eventAt = startRaw ? eventLocalToIso(startRaw) : null;
  const endsAt = endRaw ? eventLocalToIso(endRaw) : null;

  if (endsAt && !eventAt) return "Set a start time before adding an end time.";
  if (eventAt && endsAt && new Date(endsAt) <= new Date(eventAt)) {
    return "The end time must be after the start time.";
  }

  return { title, description: text("description"), location: text("location"), eventAt, endsAt };
}

export async function createEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await verifyAdminSession();
  const input = parseEventForm(formData);
  if (typeof input === "string") return { ok: false, message: input, values: submittedValues(formData) };

  const event = await createEvent(input);
  redirect(`/admin/events/${event.id}`);
}

export async function updateEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await verifyAdminSession();
  const id = String(formData.get("id") ?? "");
  const input = parseEventForm(formData);
  if (typeof input === "string") return { ok: false, message: input, values: submittedValues(formData) };

  await updateEvent(id, input);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return { ok: true, message: "Event saved." };
}
