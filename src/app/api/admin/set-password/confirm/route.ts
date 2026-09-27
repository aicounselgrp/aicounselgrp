import { verifySetPasswordToken, createSession } from "@/lib/session";
import { setAdminPassword } from "@/lib/admins";

const MIN_PASSWORD_LENGTH = 10;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { token?: string; password?: string }
    | null;

  const token = body?.token;
  const password = body?.password;

  if (!token || !password) {
    return Response.json({ error: "Missing token or password." }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const email = await verifySetPasswordToken(token);
  if (!email) {
    return Response.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }

  await setAdminPassword(email, password);
  await createSession(email, "admin");

  return Response.json({ ok: true });
}
