import { verifyAdminPassword } from "@/lib/admins";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const verifiedEmail = await verifyAdminPassword(email, password);
  if (!verifiedEmail) {
    return Response.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSession(verifiedEmail, "admin");
  return Response.json({ ok: true });
}
