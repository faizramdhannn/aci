"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionaries";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useDictionary();
  const next: Locale = locale === "en" ? "id" : "en";

  return (
    <button
      type="button"
      aria-label={`${t.nav.language}: ${next === "en" ? "English" : "Bahasa Indonesia"}`}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
      className={`rounded-full px-2 py-1 text-xs font-semibold tracking-wide text-brown-soft transition-colors hover:text-brown ${className}`}
    >
      <span className={locale === "en" ? "text-orange" : ""}>EN</span>
      <span className="mx-1 opacity-40">/</span>
      <span className={locale === "id" ? "text-orange" : ""}>ID</span>
    </button>
  );
}
