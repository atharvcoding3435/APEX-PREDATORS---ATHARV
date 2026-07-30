import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const accessTokenCookie = "resourcify-access-token";
const appSessionCookie = "resourcify-app-session";
const protectedPaths = ["/dashboard", "/resources", "/bookings", "/profile", "/admin"];

export function middleware(request: NextRequest) {
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isProtectedPath || request.cookies.has(accessTokenCookie) || request.cookies.has(appSessionCookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/resources/:path*", "/bookings/:path*", "/profile/:path*", "/admin/:path*"]
};
