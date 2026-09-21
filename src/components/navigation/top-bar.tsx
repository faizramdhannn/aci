import Link from "next/link";
import { desktopNavItems } from "@/config/site";

export function TopBar() {
  return (
    <>
      <header className="sticky top-0 z-40 hidden md:block">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="glass flex items-center justify-between rounded-full px-6 py-3 shadow-sm">
            <Link href="/" className="font-display text-2xl font-semibold text-brown">
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
              <Link href="/search" className="transition-colors hover:text-brown">
                Search
              </Link>
              <Link href="/favorites" className="transition-colors hover:text-brown">
                Favorites
              </Link>
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

      {/* Mobile: compact top strip, just logo + search (categories/nav live in the bottom bar) */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 pt-4 md:hidden">
        <Link href="/" className="glass rounded-full px-4 py-2 font-display text-lg font-semibold text-brown">
          Aci
        </Link>
        <Link href="/search" aria-label="Search" className="glass flex h-10 w-10 items-center justify-center rounded-full">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-brown">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </Link>
      </header>
    </>
  );
}
