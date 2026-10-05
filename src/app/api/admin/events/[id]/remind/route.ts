import { getSession } from "@/lib/session";
import { getEvent, getReminderRecipients } from "@/lib/events";
import { sendEventEmail } from "@/lib/event-emails";

// Bulk sends are paced to stay under the email provider's rate limit, so
// allow time for larger batches to finish.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/admin/events/[id]/remind">) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const event = await getEvent(id);
  if (!event) {
    return Response.json({ error: "Event not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { subject?: string; body?: string } | null;
  const subject = body?.subject?.trim();
  const text = body?.body?.trim();
  if (!subject || !text) {
    return Response.json({ error: "Subject and body are required." }, { status: 400 });
  }

  const recipients = await getReminderRecipients(id);
  if (recipients.length === 0) {
    return Response.json(
      { error: "No one to remind yet — send an invite first." },
      { status: 400 },
    );
  }

  const { sent, failed } = await sendEventEmail({
    event,
    subject,
    body: text,
    recipients,
    audienceLabel: `Event reminder: ${event.title}`,
    sentBy: session.email,
    origin: new URL(request.url).origin,
  });

  return Response.json({ ok: true, sent, failed });
}
