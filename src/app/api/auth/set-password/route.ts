import { createSession, verifyMemberSetPasswordToken } from "@/lib/session";
import { findActiveMemberById, setMemberPassword } from "@/lib/members";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { token?: string; password?: string }
    | null;

  const memberId = body?.token ? await verifyMemberSetPasswordToken(body.token) : null;
  const member = memberId ? await findActiveMemberById(memberId) : undefined;
  if (!member) {
    return Response.json(
      { error: "This link is invalid or has expired. Request a new one from the login page." },
      { status: 400 },
    );
  }

  const password = body?.password ?? "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  await setMemberPassword(member.id, password);
  await createSession(member.email, "member");
  return Response.json({ ok: true });
}
