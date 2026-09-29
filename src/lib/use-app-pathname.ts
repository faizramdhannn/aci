"use client";

import { usePathname } from "next/navigation";
import { LOCALES } from "@/lib/i18n/dictionaries";

const PREFIX = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);

/** Strips the internal /[locale] prefix so a path reads the same on the server and in the browser. */
export function stripLocale(pathname: string): string {
  return pathname.replace(PREFIX, "") || "/";
}

/** usePathname() without the internal locale segment: identical during prerender and after hydration. */
export function useAppPathname(): string {
  return stripLocale(usePathname());
}
