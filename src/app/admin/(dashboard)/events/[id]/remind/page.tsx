import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/events";
import { defaultReminderBody } from "@/lib/event-emails";
import { EventComposeForm } from "../event-compose-form";

export const metadata: Metadata = {
  title: "Send Reminder",
};

export default async function RemindEventPage(props: PageProps<"/admin/events/[id]/remind">) {
  const { id } = await props.params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Remind members about &ldquo;{event.title}&rdquo;
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Sends to everyone who hasn&apos;t said no (yes + not-yet-responded) — not to members who
        already declined.
      </p>

      <div className="mt-8">
        <EventComposeForm
          sendUrl={`/api/admin/events/${event.id}/remind`}
          defaultSubject={`Reminder: ${event.title}`}
          defaultBody={defaultReminderBody(event)}
          submitLabel="Send reminder"
        />
      </div>
    </>
  );
}
