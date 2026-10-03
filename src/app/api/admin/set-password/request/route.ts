import { adminExists } from "@/lib/admins";
import { createSetPasswordToken } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  // Respond the same way whether or not the email is an admin, so this
  // endpoint can't be used to enumerate admins. The one exception is a failed
  // send to a real admin: surfacing that beats a silent "sent" that never
  // arrives.
  if (await adminExists(email)) {
    const token = await createSetPasswordToken(email);
    const origin = new URL(request.url).origin;
    const link = `${origin}/admin/set-password?token=${token}`;

    const result = await sendEmail({
      to: email,
      subject: `Set your ${siteConfig.shortName} admin password`,
      text: `Set (or reset) your admin password (expires in 1 hour):\n\n${link}`,
    });

    if (!result.ok) {
      return Response.json(
        { error: "We couldn't send the email. Please try again shortly, or contact the site owner." },
        { status: 502 },
      );
    }
  }

  return Response.json({ ok: true });
}
