import { createMagicLinkToken, createMemberSetPasswordToken } from "@/lib/session";
import { findActiveMemberByLoginEmail } from "@/lib/members";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

// Emails a member either a one-time login link (the backup to password
// login) or a link to set/reset their password. Either the work or the
// backup email can be used; the link goes to whichever address was entered.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; purpose?: "login" | "set-password" }
    | null;
  const email = body?.email?.trim();
  const purpose = body?.purpose === "set-password" ? "set-password" : "login";

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const member = await findActiveMemberByLoginEmail(email);

  // Always respond the same way regardless of whether the email matched, so
  // this endpoint can't be used to enumerate the member roster.
  if (member) {
    const origin = new URL(request.url).origin;
    const to =
      member.backupEmail && member.backupEmail.toLowerCase() === email.toLowerCase()
        ? member.backupEmail
        : member.email;

    const message =
      purpose === "set-password"
        ? {
            subject: `Set your ${siteConfig.shortName} password`,
            text: `Click to set (or reset) your ${siteConfig.shortName} member password (expires in 1 hour):\n\n${origin}/set-password?token=${await createMemberSetPasswordToken(member.id)}\n\nIf you didn't ask for this, you can ignore this email.`,
          }
        : {
            subject: `Your ${siteConfig.shortName} member login link`,
            text: `Click to log in to the member directory (expires in 15 minutes):\n\n${origin}/api/auth/verify?token=${await createMagicLinkToken(member.email)}`,
          };

    await sendEmail({ to, ...message });
  }

  return Response.json({ ok: true });
}
