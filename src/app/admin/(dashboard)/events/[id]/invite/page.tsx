import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent, getRsvpsForEvent } from "@/lib/events";
import { defaultInviteBody } from "@/lib/event-emails";
import { getAllMembers } from "@/lib/members";
import { parseLocation } from "@/lib/locations";
import { InviteForm, type InviteCandidate } from "./invite-form";

export const metadata: Metadata = {
  title: "Send Invite",
};

export default async function InviteEventPage(props: PageProps<"/admin/events/[id]/invite">) {
  const { id } = await props.params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [members, rsvps] = await Promise.all([getAllMembers(), getRsvpsForEvent(id)]);
  const invited = new Set(rsvps.map((r) => r.memberId));
  const candidates: InviteCandidate[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    firm: m.firm,
    industry: m.industry,
    status: m.status,
    ...parseLocation(m.location),
    alreadyInvited: invited.has(m.id),
  }));

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Invite members to &ldquo;{event.title}&rdquo;
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Choose who to invite. Only the members you select get this email, and their RSVPs are
        tracked on the event page. Reminders later go only to people who were invited.
      </p>

      <div className="mt-8">
        <InviteForm
          sendUrl={`/api/admin/events/${event.id}/invite`}
          defaultSubject={`You're invited: ${event.title}`}
          defaultBody={defaultInviteBody(event)}
          members={candidates}
        />
      </div>
    </>
  );
}
