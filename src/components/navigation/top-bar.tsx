import { DesktopNavLinks, FavoritesNavLink } from "@/components/navigation/desktop-nav-links";
import { SearchPopover } from "@/components/navigation/search-popover";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { SiteSwitcher } from "@/components/navigation/site-switcher";

export async function TopBar() {
  return (
    <>
      <header className="sticky top-0 z-40 hidden md:block">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="glass flex items-center justify-between rounded-full px-6 py-3 shadow-sm">
            <SiteSwitcher current="outfit" />

            <DesktopNavLinks />

            <div className="flex items-center gap-4 text-sm font-medium text-brown-soft">
              <SearchPopover variant="desktop" />
              <FavoritesNavLink />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: compact top strip, logo + language + theme + search (nav lives in the bottom bar) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 pt-4 md:hidden">
        <div className="glass rounded-full px-1 py-1">
          <SiteSwitcher current="outfit" compact />
        </div>
        <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
          <LanguageToggle />
          <ThemeToggle />
          <SearchPopover variant="mobile" />
        </div>
      </header>
    </>
  );
}
