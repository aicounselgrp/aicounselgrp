import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  // Optimistic check only (cookie + signature), per Next.js auth guidance.
  // Each page re-verifies authoritatively (member still active / admin role).
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/members", "/admin/:path*"],
};
