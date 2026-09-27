import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { findMemberByEmail } from "@/lib/members";

export async function proxy(request: NextRequest) {
  // Optimistic check only (cookie + signature), per Next.js auth guidance.
  // The page itself re-verifies against the live member list.
  const email = await getSessionEmail();
  if (!email || !findMemberByEmail(email)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/members"],
};
