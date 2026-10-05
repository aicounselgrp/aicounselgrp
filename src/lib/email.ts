import "server-only";
import { Resend } from "resend";

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

// Resend only accepts a few requests per second per account. Bulk sends
// (CSV-import welcomes, broadcasts, event invites) call sendEmail in a tight
// loop, so space sends out and retry when Resend says we're going too fast,
// rather than dropping emails.
const MIN_INTERVAL_MS = 600;
const MAX_ATTEMPTS = 4;
let nextSendAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForSendSlot() {
  const now = Date.now();
  const wait = Math.max(0, nextSendAt - now);
  nextSendAt = Math.max(now, nextSendAt) + MIN_INTERVAL_MS;
  if (wait > 0) await sleep(wait);
}

function isRateLimited(error: { name?: string; statusCode?: number | null }) {
  return error.statusCode === 429 || error.name === "rate_limit_exceeded";
}

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

  for (let attempt = 1; ; attempt++) {
    await waitForSendSlot();
    const { error } = await resend.emails.send({ from: fromEmail, to, subject, text, replyTo });

    if (!error) return { ok: true as const };

    if (isRateLimited(error) && attempt < MAX_ATTEMPTS) {
      // Back off a little more each time before trying again.
      await sleep(1000 * attempt);
      continue;
    }

    console.error(`[email] Resend error sending to ${to}:`, error);
    return { ok: false as const, error };
  }
}
