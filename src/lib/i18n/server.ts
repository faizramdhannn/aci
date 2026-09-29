import { cookies } from "next/headers";
import { locale as localeParam } from "next/root-params";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dictionaries, isLocale, type Locale } from "@/lib/i18n/dictionaries";

/**
 * The language of the current request. Pages live under an internal
 * /[locale] segment (src/proxy.ts rewrites /narras → /id/narras from the
 * visitor's cookie), so a page reads it from the route, which keeps pages
 * cacheable. Route handlers can't read root params and fall back to the cookie.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const value = await localeParam();
    if (isLocale(value)) return value;
  } catch {
    /* not inside the [locale] tree (e.g. a route handler) */
  }
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : DEFAULT_LOCALE;
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}

export async function getAdminDictionary() {
  const { adminDictionaries } = await import("@/lib/i18n/admin-dictionaries");
  return adminDictionaries[await getLocale()];
}

export async function getStoreDictionary() {
  const { storeDictionaries } = await import("@/lib/i18n/store-dictionaries");
  return storeDictionaries[await getLocale()];
}
