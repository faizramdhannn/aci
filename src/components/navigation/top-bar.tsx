import Link from "next/link";
import { desktopNavItems } from "@/config/site";
import { SearchPopover } from "@/components/navigation/search-popover";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { Logo } from "@/components/navigation/logo";

export function TopBar() {
  return (
    <>
      <header className="sticky top-0 z-40 hidden md:block">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="glass flex items-center justify-between rounded-full px-6 py-3 shadow-sm">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-brown">
              <Logo size={30} />
              Aci
            </Link>

            <nav className="flex items-center gap-8 text-sm font-medium text-brown-soft">
              {desktopNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-brown">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 text-sm font-medium text-brown-soft">
              <SearchPopover variant="desktop" />
              <Link href="/favorites" className="transition-colors hover:text-brown">
                Favorites
              </Link>
              <ThemeToggle />
              <Link
                href="/admin"
                className="rounded-full bg-brown px-4 py-1.5 text-cream transition-opacity hover:opacity-90"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: compact top strip, just logo + search + theme (categories/nav live in the bottom bar) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 pt-4 md:hidden">
        <Link href="/" className="glass flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-lg font-semibold text-brown">
          <Logo size={24} />
          Aci
        </Link>
        <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1.5">
          <ThemeToggle />
          <SearchPopover variant="mobile" />
        </div>
      </header>
    </>
  );
}
