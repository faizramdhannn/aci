import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SplashGate } from "@/components/storefront/splash-gate";
import { AdminBar } from "@/components/navigation/admin-bar";
import { LiveRefresh } from "@/components/live-refresh";
import { SPLASH_SEEN_SCRIPT } from "@/lib/splash";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";
import { getStoreSettings } from "@/lib/store/data";
import { siteUrl } from "@/lib/site-url";
import { fontVariables } from "@/lib/fonts";
import { getLocale } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";
import { HUB_NAME } from "@/config/site";
import "../globals.css";

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

/** Pages render on first request per language and are then cached (see src/lib/revalidate.ts). */
export function generateStaticParams() {
  return [];
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const [locale, site, store] = await Promise.all([getLocale(), getSiteSettings(), getStoreSettings()]);

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SEEN_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-brown" suppressHydrationWarning>
        <LocaleProvider locale={locale}>
          <AdminBar />
          <SplashGate words={{ outfit: site.siteName.toLowerCase(), store: store.storeName }} />
          <ToastProvider>{children}</ToastProvider>
          <LiveRefresh />
        </LocaleProvider>
      </body>
    </html>
  );
}
