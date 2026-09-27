import { redirect } from "next/navigation";
import { verifyMagicLinkToken, createSession, isAdminEmail } from "@/lib/session";
import { findActiveMemberByEmail } from "@/lib/members";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const email = token ? await verifyMagicLinkToken(token) : null;

  if (!email) {
    redirect("/login?error=invalid-or-expired-link");
  }

  if (isAdminEmail(email)) {
    await createSession(email, "admin");
    redirect("/admin");
  }

  const member = await findActiveMemberByEmail(email);
  if (!member) {
    redirect("/login?error=invalid-or-expired-link");
  }

  await createSession(member.email, "member");
  redirect("/members");
}
