import { redirect } from "next/navigation";
import { verifyEmailChangeToken } from "@/lib/session";
import { confirmChangeRequestEmail } from "@/lib/profile-changes";

// Linked from the email sent to a member's proposed new work email.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const requestId = token ? await verifyEmailChangeToken(token) : null;
  const confirmed = requestId ? await confirmChangeRequestEmail(requestId) : undefined;

  redirect(confirmed ? "/account?email=confirmed" : "/account?email=invalid-link");
}
