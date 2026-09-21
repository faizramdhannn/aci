import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((request: NextRequest & { auth?: unknown }) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !request.auth) {
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
