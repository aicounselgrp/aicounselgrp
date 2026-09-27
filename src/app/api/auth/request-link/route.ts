import { createMagicLinkToken, isAdminEmail } from "@/lib/session";
import { findActiveMemberByEmail } from "@/lib/members";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const isAdmin = isAdminEmail(email);
  const member = isAdmin ? undefined : await findActiveMemberByEmail(email);

  // Always respond the same way regardless of whether the email matched, so
  // this endpoint can't be used to enumerate admins or the member roster.
  if (isAdmin || member) {
    const token = await createMagicLinkToken(email.toLowerCase());
    const origin = new URL(request.url).origin;
    const link = `${origin}/api/auth/verify?token=${token}`;

    await sendEmail({
      to: email,
      subject: `Your ${siteConfig.shortName} login link`,
      text: `Click to log in (expires in 15 minutes):\n\n${link}`,
    });
  }

  return Response.json({ ok: true });
}
