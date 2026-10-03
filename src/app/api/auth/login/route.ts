import { createSession } from "@/lib/session";
import { verifyMemberPassword } from "@/lib/members";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Accepts the work or backup email. The session always records the work
  // email, which is what the rest of the site keys members by.
  const member = await verifyMemberPassword(email, password);
  if (!member) {
    return Response.json(
      {
        error:
          "Incorrect email or password. If you haven't set a password yet, use the link below to set one.",
      },
      { status: 401 },
    );
  }

  await createSession(member.email, "member");
  return Response.json({ ok: true });
}
