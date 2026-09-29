import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getRsvpsForEvent } from "@/lib/events";
import { formatEventDate } from "@/lib/event-emails";

export const metadata: Metadata = {
  title: "Event",
};

export default async function EventDetailPage(props: PageProps<"/admin/events/[id]">) {
  const { id } = await props.params;
  const event = await getEvent(id);
  if (!event) notFound();

  const rsvps = await getRsvpsForEvent(id);
  const yes = rsvps.filter((r) => r.response === "yes");
  const no = rsvps.filter((r) => r.response === "no");
  const pending = rsvps.filter((r) => r.response === "pending");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
            {event.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
            {formatEventDate(event.eventAt)}
            {event.location && ` · ${event.location}`}
          </p>
          {event.description && (
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/events/${event.id}/invite`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Send invite
          </Link>
          <Link
            href={`/admin/events/${event.id}/remind`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
          >
            Send reminder
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <RsvpColumn title="Attending" people={yes} />
        <RsvpColumn title="Not attending" people={no} />
        <RsvpColumn title="No response yet" people={pending} />
      </div>
    </>
  );
}

function RsvpColumn({
  title,
  people,
}: {
  title: string;
  people: { id: string; memberName: string; memberEmail: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title} ({people.length})
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        {people.map((p) => (
          <li key={p.id}>{p.memberName}</li>
        ))}
        {people.length === 0 && <li className="text-slate-400 dark:text-slate-600">—</li>}
      </ul>
    </div>
  );
}
