import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/lib/events";
import { formatEventDate } from "@/lib/event-emails";
import { createEventAction } from "./actions";

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
              {formatEventDate(event.eventAt)}
              {event.location && ` · ${event.location}`}
            </p>
          </Link>
        ))}
      </div>

      <form
        action={createEventAction}
        className="mt-10 max-w-lg space-y-4 rounded-lg border border-slate-200 p-6 dark:border-slate-800"
      >
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">New event</h3>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="eventAt" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Date &amp; time
            </label>
            <input
              id="eventAt"
              name="eventAt"
              type="datetime-local"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Create event
        </button>
      </form>
    </>
  );
}
