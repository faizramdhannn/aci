import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth, isAdminSession } from "@/lib/auth";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale } from "@/lib/i18n/dictionaries";
import { AUTH_HINT_COOKIE } from "@/lib/auth-hint";

/**
 * 1. Guards /admin.
 * 2. Serves every page from its internal /[locale] copy (/narras → /id/narras)
 *    based on the visitor's language cookie. URLs stay unprefixed, and pages
 *    no longer read cookies themselves, so they can be cached and shared.
 * 3. Keeps a small readable hint cookie ("customer" / "admin") so cached pages
 *    know in the browser whether to fetch the signed-in account's details.
 */
export default auth((request: NextRequest & { auth?: Session | null }) => {
  const { pathname, search } = request.nextUrl;
  const session = request.auth;

  if (pathname.startsWith("/admin") && !isAdminSession(session)) {
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const first = pathname.split("/")[1];
  let response: NextResponse;
  if (LOCALES.includes(first as never)) {
    response = NextResponse.next();
  } else {
    const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;
    response = NextResponse.rewrite(new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url));
  }

  const hint = session ? (isAdminSession(session) ? "admin" : "customer") : null;
  if (hint && request.cookies.get(AUTH_HINT_COOKIE)?.value !== hint) {
    response.cookies.set(AUTH_HINT_COOKIE, hint, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  } else if (!hint && request.cookies.has(AUTH_HINT_COOKIE)) {
    response.cookies.delete(AUTH_HINT_COOKIE);
  }
  return response;
});

export const config = {
  // Pages only: not API routes, Next internals, redirects, or files with an extension.
  matcher: ["/((?!api|go|_next|.*\\..*).*)"],
};
