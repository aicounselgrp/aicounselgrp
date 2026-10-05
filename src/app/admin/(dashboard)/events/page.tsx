import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/lib/events";
import { formatEventWhen } from "@/lib/event-emails";
import { EventForm } from "./event-form";

export const metadata: Metadata = {
  title: "Events",
};

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Events
      </h2>

      <div className="mt-6 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-500">No events yet.</p>
        )}
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/admin/events/${event.id}`}
            className="block rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
          >
            <p className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              {formatEventWhen(event)}
              {event.location && ` · ${event.location}`}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 max-w-lg rounded-lg border border-slate-200 p-6 dark:border-slate-800">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">New event</h3>
        <EventForm />
      </div>
    </>
  );
}
