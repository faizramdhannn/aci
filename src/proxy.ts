import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth, isAdminSession } from "@/lib/auth";

export default auth((request: NextRequest & { auth?: Session | null }) => {
  const { pathname } = request.nextUrl;

  // A signed-in by.narras customer is not an admin.
  if (pathname.startsWith("/admin") && !isAdminSession(request.auth)) {
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
