import "server-only";
import { Resend } from "resend";

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

// Falls back to logging when RESEND_API_KEY isn't configured, so local dev
// and testing work without a Resend account.
export async function sendEmail({ to, subject, text, replyTo }: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.JOIN_FROM_EMAIL ?? "applications@example.org";

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY is not set — logging instead of sending.`, {
      to,
      subject,
      text,
    });
    return { ok: true as const };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: fromEmail, to, subject, text, replyTo });

  if (error) {
    console.error("[email] Resend error:", error);
    return { ok: false as const, error };
  }

  return { ok: true as const };
}
