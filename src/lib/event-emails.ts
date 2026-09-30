import "server-only";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/email-templates";
import { createRsvpToken } from "@/lib/session";
import type { Event } from "@/lib/events";

// No end time is captured for events, so calendar invites assume this length.
const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function formatEventDate(eventAt: string | null): string {
  if (!eventAt) return "TBD";
  return new Date(eventAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
}

// YYYYMMDDTHHMMSSZ — the compact UTC format Google Calendar's link API wants.
function toGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, "");
}

// null when there's no date yet — nothing to build a calendar invite from.
export function googleCalendarUrl(event: Event): string | null {
  if (!event.eventAt) return null;
  const start = new Date(event.eventAt);
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: Event): string | null {
  if (!event.eventAt) return null;
  const start = new Date(event.eventAt);
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    subject: event.title,
    location: event.location,
    body: event.description,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function calendarLinkLines(event: Event): string[] {
  const gcal = googleCalendarUrl(event);
  const outlook = outlookCalendarUrl(event);
  if (!gcal || !outlook) return []; // no date set yet — nothing to link to

  return ["", "Add to your calendar:", `Google: {{gcal_url}}`, `Outlook: {{outlook_url}}`];
}

export function defaultInviteBody(event: Event): string {
  return [
    `Hi {{name}},`,
    "",
    `You're invited: ${event.title}, ${formatEventDate(event.eventAt)}${event.location ? ` at ${event.location}` : ""}.`,
    "",
    event.description || "",
    ...calendarLinkLines(event),
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
    ...calendarLinkLines(event),
    "",
    `Haven't RSVP'd yet, or need to change your answer?`,
    `Yes: {{rsvp_yes_url}}`,
    `No: {{rsvp_no_url}}`,
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");
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

  // Same for every recipient, so compute once rather than per-loop-iteration.
  const gcalUrl = googleCalendarUrl(input.event) ?? "";
  const outlookUrl = outlookCalendarUrl(input.event) ?? "";

  for (const recipient of input.recipients) {
    const token = await createRsvpToken(input.event.id, recipient.id);
    const vars = {
      name: recipient.name,
      event_title: input.event.title,
      event_date: formatEventDate(input.event.eventAt),
      event_location: input.event.location || "TBD",
      rsvp_yes_url: `${input.origin}/api/events/rsvp?token=${token}&response=yes`,
      rsvp_no_url: `${input.origin}/api/events/rsvp?token=${token}&response=no`,
      gcal_url: gcalUrl,
      outlook_url: outlookUrl,
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
