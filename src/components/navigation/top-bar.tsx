import Link from "next/link";
import { desktopNavItems } from "@/config/site";
import { SearchPopover } from "@/components/navigation/search-popover";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { Logo } from "@/components/navigation/logo";
import { getDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";

export async function TopBar() {
  const [t, settings] = await Promise.all([getDictionary(), getSiteSettings()]);

  return (
    <>
      <header className="sticky top-0 z-40 hidden md:block">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="glass flex items-center justify-between rounded-full px-6 py-3 shadow-sm">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-brown">
              <Logo size={30} />
              {settings.siteName}
            </Link>

            <nav className="flex items-center gap-8 text-sm font-medium text-brown-soft">
              {desktopNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-brown">
                  {t.nav[item.key]}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 text-sm font-medium text-brown-soft">
              <SearchPopover variant="desktop" />
              <Link href="/favorites" className="transition-colors hover:text-brown">
                {t.nav.favorites}
              </Link>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: compact top strip, logo + language + theme + search (nav lives in the bottom bar) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 pt-4 md:hidden">
        <Link href="/" className="glass flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-lg font-semibold text-brown">
          <Logo size={24} />
          {settings.siteName}
        </Link>
        <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
          <LanguageToggle />
          <ThemeToggle />
          <SearchPopover variant="mobile" />
        </div>
      </header>
    </>
  );
}
