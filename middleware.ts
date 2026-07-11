import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "session";

/**
 * Lightweight gate: redirects to /auth/login if no session cookie is
 * present on any /dashboard/* route. This is a presence check only —
 * cookie signature/claims verification (and the actual admin vs.
 * employee role split, e.g. blocking an admin from /dashboard/my-payslips
 * as if it were their own, and vice versa) happens in AuthProvider /
 * AppShell on the client and again in every server API route via
 * requireAdmin() / getCallerProfile(), which is where enforcement that
 * actually matters lives. Middleware here just avoids a flash of
 * protected UI for fully signed-out visitors.
 */
export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE_NAME);
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
