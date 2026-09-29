import "server-only";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/email-templates";
import { createRsvpToken } from "@/lib/session";
import type { Event } from "@/lib/events";

export function formatEventDate(eventAt: string | null): string {
  if (!eventAt) return "TBD";
  return new Date(eventAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
}

export function defaultInviteBody(event: Event): string {
  return [
    `Hi {{name}},`,
    "",
    `You're invited: ${event.title}, ${formatEventDate(event.eventAt)}${event.location ? ` at ${event.location}` : ""}.`,
    "",
    event.description || "",
    "",
    `Will you be there?`,
    `Yes: {{rsvp_yes_url}}`,
    `No: {{rsvp_no_url}}`,
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");
}

export function defaultReminderBody(event: Event): string {
  return [
    `Hi {{name}},`,
    "",
    `Reminder: ${event.title} is coming up — ${formatEventDate(event.eventAt)}${event.location ? ` at ${event.location}` : ""}.`,
    "",
    `Haven't RSVP'd yet, or need to change your answer?`,
    `Yes: {{rsvp_yes_url}}`,
    `No: {{rsvp_no_url}}`,
  ].join("\n");
}

// Loops per-recipient (unlike lib/broadcast.ts) because each RSVP link is
// unique to that member+event, not just their name.
export async function sendEventEmail(input: {
  event: Event;
  subject: string;
  body: string;
  recipients: { id: string; name: string; email: string }[];
  audienceLabel: string;
  sentBy: string;
  origin: string;
}): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of input.recipients) {
    const token = await createRsvpToken(input.event.id, recipient.id);
    const vars = {
      name: recipient.name,
      event_title: input.event.title,
      event_date: formatEventDate(input.event.eventAt),
      event_location: input.event.location || "TBD",
      rsvp_yes_url: `${input.origin}/api/events/rsvp?token=${token}&response=yes`,
      rsvp_no_url: `${input.origin}/api/events/rsvp?token=${token}&response=no`,
    };
    const result = await sendEmail({
      to: recipient.email,
      subject: renderTemplate(input.subject, vars),
      text: renderTemplate(input.body, vars),
    });
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      console.error(`[event-email] Could not send to ${recipient.email}`);
    }
  }

  await sql`
    insert into email_broadcasts (subject, body, audience, recipient_count, sent_by)
    values (${input.subject}, ${input.body}, ${input.audienceLabel}, ${sent}, ${input.sentBy})
  `;

  return { sent, failed };
}
