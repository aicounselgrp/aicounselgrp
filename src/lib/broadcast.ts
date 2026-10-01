import "server-only";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/email-templates";
import { firstNameOf } from "@/lib/names";

export type Recipient = { name: string; firstName?: string; email: string };

// Sends one-by-one (never a shared to/cc list — recipients shouldn't see
// each other's addresses) with {{name}} rendered per recipient, then logs
// the send for admin visibility. Returns how many actually went out.
export async function sendBroadcast(input: {
  subject: string;
  body: string;
  recipients: Recipient[];
  audience: string;
  sentBy: string;
}): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of input.recipients) {
    const vars = { name: recipient.name, first_name: firstNameOf(recipient) };
    const result = await sendEmail({
      to: recipient.email,
      subject: renderTemplate(input.subject, vars),
      text: renderTemplate(input.body, vars),
    });
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      console.error(`[broadcast] Could not send to ${recipient.email}`);
    }
  }

  await sql`
    insert into email_broadcasts (subject, body, audience, recipient_count, sent_by)
    values (${input.subject}, ${input.body}, ${input.audience}, ${sent}, ${input.sentBy})
  `;

  return { sent, failed };
}
