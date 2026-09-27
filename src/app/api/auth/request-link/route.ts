import { createMagicLinkToken } from "@/lib/session";
import { findActiveMemberByEmail } from "@/lib/members";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const member = await findActiveMemberByEmail(email);

  // Always respond the same way regardless of whether the email matched, so
  // this endpoint can't be used to enumerate the member roster.
  if (member) {
    const token = await createMagicLinkToken(member.email);
    const origin = new URL(request.url).origin;
    const link = `${origin}/api/auth/verify?token=${token}`;

    await sendEmail({
      to: member.email,
      subject: `Your ${siteConfig.shortName} member login link`,
      text: `Click to log in to the member directory (expires in 15 minutes):\n\n${link}`,
    });
  }

  return Response.json({ ok: true });
}
