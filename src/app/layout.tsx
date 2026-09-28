import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SplashGate } from "@/components/storefront/splash-gate";
import { SPLASH_COOKIES, type SplashBrand } from "@/lib/splash";
import { getStoreSettings } from "@/lib/store/data";
import { cookies } from "next/headers";
import { siteUrl } from "@/lib/site-url";
import { fontVariables } from "@/lib/fonts";
import { getLocale } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);
  const description = settings.tagline || "Tap an item in the photo to see where it's from.";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings.siteName} — shop the look`,
      template: `%s — ${settings.siteName}`,
    },
    description,
    openGraph: {
      siteName: settings.siteName,
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
      alternateLocale: locale === "id" ? "en_US" : "id_ID",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, cookieStore, site, store] = await Promise.all([
    getLocale(),
    cookies(),
    getSiteSettings(),
    getStoreSettings(),
  ]);
  const seen = (Object.keys(SPLASH_COOKIES) as SplashBrand[]).filter((b) => cookieStore.get(SPLASH_COOKIES[b]));

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-cream text-brown" suppressHydrationWarning>
        <LocaleProvider locale={locale}>
          <SplashGate
            words={{ outfit: site.siteName.toLowerCase(), store: store.storeName }}
            seen={seen}
          />
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
