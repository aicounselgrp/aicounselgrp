"use server";

import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/dal";
import { createEvent } from "@/lib/events";

export async function createEventAction(formData: FormData) {
  await verifyAdminSession();
  const title = formData.get("title");
  const description = formData.get("description");
  const location = formData.get("location");
  const eventAtRaw = formData.get("eventAt");

  if (typeof title !== "string" || !title.trim()) return;

  const event = await createEvent({
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    location: typeof location === "string" ? location.trim() : "",
    eventAt:
      typeof eventAtRaw === "string" && eventAtRaw ? new Date(eventAtRaw).toISOString() : null,
  });

  redirect(`/admin/events/${event.id}`);
}
