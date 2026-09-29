import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SplashGate } from "@/components/storefront/splash-gate";
import { AdminBar } from "@/components/navigation/admin-bar";
import { LiveRefresh } from "@/components/live-refresh";
import { auth, isAdminSession } from "@/lib/auth";
import { SPLASH_COOKIES, type SplashBrand } from "@/lib/splash";
import { getStoreSettings } from "@/lib/store/data";
import { cookies } from "next/headers";
import { siteUrl } from "@/lib/site-url";
import { fontVariables } from "@/lib/fonts";
import { getLocale } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";
import { HUB_NAME } from "@/config/site";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf9e3" },
    { media: "(prefers-color-scheme: dark)", color: "#211712" },
  ],
};

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
    // Home-screen app on iOS: full screen, with the status bar over the page colour.
    appleWebApp: { capable: true, title: HUB_NAME, statusBarStyle: "default" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, cookieStore, site, store, session] = await Promise.all([
    getLocale(),
    cookies(),
    getSiteSettings(),
    getStoreSettings(),
    auth(),
  ]);
  const seen = (Object.keys(SPLASH_COOKIES) as SplashBrand[]).filter((b) => cookieStore.get(SPLASH_COOKIES[b]));

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-cream text-brown" suppressHydrationWarning>
        <LocaleProvider locale={locale}>
          {isAdminSession(session) && <AdminBar email={session!.user?.email ?? ""} />}
          <SplashGate
            words={{ outfit: site.siteName.toLowerCase(), store: store.storeName }}
            seen={seen}
          />
          <ToastProvider>{children}</ToastProvider>
          <LiveRefresh />
        </LocaleProvider>
      </body>
    </html>
  );
}
