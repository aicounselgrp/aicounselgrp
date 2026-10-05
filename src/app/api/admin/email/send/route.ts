import { getSession } from "@/lib/session";
import { getActiveMembers } from "@/lib/members";
import { sendBroadcast } from "@/lib/broadcast";

// Bulk sends are paced to stay under the email provider's rate limit, so
// allow time for larger batches to finish.
export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        audience?: "all" | "selected" | "specific";
        memberIds?: string[];
        to?: string;
        toName?: string;
        subject?: string;
        body?: string;
      }
    | null;

  const subject = body?.subject?.trim();
  const text = body?.body?.trim();

  if (!subject || !text) {
    return Response.json({ error: "Subject and body are required." }, { status: 400 });
  }

  let recipients: { name: string; firstName?: string; email: string }[];
  let audienceLabel: string;

  if (body?.audience === "selected") {
    // Resolve IDs against active members server-side, so this option can
    // only ever reach current members.
    const ids = new Set(Array.isArray(body.memberIds) ? body.memberIds : []);
    const members = (await getActiveMembers()).filter((m) => ids.has(m.id));
    if (members.length === 0) {
      return Response.json({ error: "Select at least one member." }, { status: 400 });
    }
    recipients = members.map((m) => ({ name: m.name, firstName: m.firstName, email: m.email }));
    audienceLabel = `Selected members (${members.length}): ${members.map((m) => m.name).join(", ")}`;
  } else if (body?.audience === "specific") {
    const to = body.to?.trim();
    if (!to) {
      return Response.json({ error: "Recipient email is required." }, { status: 400 });
    }
    recipients = [{ name: body.toName?.trim() || to, email: to }];
    audienceLabel = to;
  } else {
    const members = await getActiveMembers();
    recipients = members.map((m) => ({ name: m.name, firstName: m.firstName, email: m.email }));
    audienceLabel = "All active members";
  }

  if (recipients.length === 0) {
    return Response.json({ error: "No recipients to send to." }, { status: 400 });
  }

  const { sent, failed } = await sendBroadcast({
    subject,
    body: text,
    recipients,
    audience: audienceLabel,
    sentBy: session.email,
  });

  return Response.json({ ok: true, sent, failed });
}
