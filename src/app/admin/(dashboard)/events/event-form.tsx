"use client";

import { useActionState } from "react";
import { EVENT_TIME_ZONE_LABEL } from "@/lib/event-time";
import { createEventAction, updateEventAction } from "./actions";

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  eventAt: string; // datetime-local, Eastern Time
  endsAt: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "block text-sm font-medium text-slate-900 dark:text-slate-100";

// Shared by "New event" (no id) and the edit form on an event's page.
export function EventForm({ id, values }: { id?: string; values?: EventFormValues }) {
  const [state, action, pending] = useActionState(id ? updateEventAction : createEventAction, null);
  const v = state?.values ?? values ?? { title: "", description: "", location: "", eventAt: "", endsAt: "" };

  return (
    <form key={JSON.stringify(v)} action={action} className="max-w-lg space-y-4">
      {id && <input type="hidden" name="id" value={id} />}
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" name="title" type="text" required defaultValue={v.title} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="eventAt" className={labelClass}>
            Starts ({EVENT_TIME_ZONE_LABEL})
          </label>
          <input id="eventAt" name="eventAt" type="datetime-local" defaultValue={v.eventAt} className={inputClass} />
        </div>
        <div>
          <label htmlFor="endsAt" className={labelClass}>
            Ends ({EVENT_TIME_ZONE_LABEL})
          </label>
          <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={v.endsAt} className={inputClass} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-500 dark:text-slate-500">
        Times are Eastern Time. Without an end time, calendar invites assume two hours.
      </p>

      <div>
        <label htmlFor="location" className={labelClass}>
          Location
        </label>
        <input id="location" name="location" type="text" defaultValue={v.location} className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" name="description" rows={3} defaultValue={v.description} className={inputClass} />
      </div>

      {state && (
        <p
          className={
            state.ok ? "text-sm text-emerald-700 dark:text-emerald-400" : "text-sm text-red-600 dark:text-red-400"
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {pending ? "Saving..." : id ? "Save event" : "Create event"}
      </button>
    </form>
  );
}
