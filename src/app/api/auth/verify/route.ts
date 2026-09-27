import { redirect } from "next/navigation";
import { verifyMagicLinkToken, createSession } from "@/lib/session";
import { findActiveMemberByEmail } from "@/lib/members";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const email = token ? await verifyMagicLinkToken(token) : null;
  const member = email ? await findActiveMemberByEmail(email) : undefined;

  if (!member) {
    redirect("/login?error=invalid-or-expired-link");
  }

  await createSession(member.email, "member");
  redirect("/members");
}
