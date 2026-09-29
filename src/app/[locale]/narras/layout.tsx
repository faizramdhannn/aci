import type { Metadata } from "next";
import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { CartLink } from "@/components/store/cart-link";
import { SiteSwitcher } from "@/components/navigation/site-switcher";
import { HUB_NAME } from "@/config/site";
import { getStoreSettings } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";
import { CartProvider } from "@/lib/store/cart";
import { AccountLink } from "@/components/store/account-link";
import { WhatsappFloat } from "@/components/store/whatsapp-float";

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getStoreSettings();
  return { title: { default: storeName, template: `%s — ${storeName}` }, openGraph: { siteName: storeName } };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, t] = await Promise.all([getStoreSettings(), getStoreDictionary()]);
  return (
    <CartProvider>
      <header className="sticky top-0 z-40 border-b border-brown/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <SiteSwitcher current="store" compact />
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <AccountLink />
            <CartLink />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <WhatsappFloat number={settings.whatsappNumber} />
      <footer className="mt-16 border-t border-brown/10 px-4 py-8 text-sm text-brown-soft sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} {settings.storeName}
          </p>
          <div className="flex gap-4">
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange">
                Instagram
              </a>
            )}
            <Link href="/narras/info" className="hover:text-orange">
              {t.store.info}
            </Link>
            <Link href="/narras/info#faq" className="hover:text-orange">
              {t.store.faq}
            </Link>
            <Link href="/" className="hover:text-orange">
              {HUB_NAME}
            </Link>
          </div>
        </div>
      </footer>
    </CartProvider>
  );
}
