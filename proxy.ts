import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";

// Publicly reachable even under /admin — you need to hit these before you
// have a session at all.
const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/set-password"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (PUBLIC_ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Optimistic check only (cookie + signature), per Next.js auth guidance.
  // Each page re-verifies authoritatively (member still active / admin role).
  const session = await getSession();

  if (path.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/members", "/admin/:path*"],
};
