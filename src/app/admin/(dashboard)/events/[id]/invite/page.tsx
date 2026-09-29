import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/events";
import { defaultInviteBody } from "@/lib/event-emails";
import { EventComposeForm } from "../event-compose-form";

export const metadata: Metadata = {
  title: "Send Invite",
};

export default async function InviteEventPage(props: PageProps<"/admin/events/[id]/invite">) {
  const { id } = await props.params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Invite members to &ldquo;{event.title}&rdquo;
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Sends to all active members and starts tracking their RSVP.
      </p>

      <div className="mt-8">
        <EventComposeForm
          sendUrl={`/api/admin/events/${event.id}/invite`}
          defaultSubject={`You're invited: ${event.title}`}
          defaultBody={defaultInviteBody(event)}
          submitLabel="Send invite"
        />
      </div>
    </>
  );
}
