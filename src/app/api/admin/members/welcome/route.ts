import { getSession } from "@/lib/session";
import { getMembersAwaitingWelcome } from "@/lib/members";
import { sendImportWelcomeEmail } from "@/lib/import-welcome-email";

// Sends are paced to stay under the email provider's rate limit, so allow
// time for a full list to finish.
export const maxDuration = 300;

// Re-sends the import welcome email to the selected members. IDs are checked
// against the "awaiting welcome" list server-side, so this can only reach
// active, directly-added members who haven't set a password.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { memberIds?: string[] } | null;
  const ids = new Set(Array.isArray(body?.memberIds) ? body.memberIds : []);
  const recipients = (await getMembersAwaitingWelcome()).filter((m) => ids.has(m.id));

  if (recipients.length === 0) {
    return Response.json({ error: "Select at least one member." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  let sent = 0;
  const failed: string[] = [];
  for (const member of recipients) {
    if (await sendImportWelcomeEmail(member, origin)) sent += 1;
    else failed.push(`${member.name} <${member.email}>`);
  }

  return Response.json({ ok: true, sent, failed });
}
