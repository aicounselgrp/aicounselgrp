import { getSession } from "@/lib/session";
import { getEvent, ensureRsvpsForActiveMembers } from "@/lib/events";
import { getActiveMembers } from "@/lib/members";
import { sendEventEmail } from "@/lib/event-emails";

export async function POST(request: Request, ctx: RouteContext<"/api/admin/events/[id]/invite">) {
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

  await ensureRsvpsForActiveMembers(id);
  const recipients = await getActiveMembers();

  const { sent, failed } = await sendEventEmail({
    event,
    subject,
    body: text,
    recipients,
    audienceLabel: `Event invite: ${event.title}`,
    sentBy: session.email,
    origin: new URL(request.url).origin,
  });

  return Response.json({ ok: true, sent, failed });
}
