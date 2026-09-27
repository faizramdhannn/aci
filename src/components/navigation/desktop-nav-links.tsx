"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { desktopNavItems } from "@/config/site";
import { useDictionary } from "@/components/i18n/locale-provider";

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop top-bar links with the current section highlighted as a pill. */
export function DesktopNavLinks() {
  const pathname = usePathname();
  const t = useDictionary();

  return (
    <nav className="flex items-center gap-1 text-sm font-medium">
      {desktopNavItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              active ? "bg-brown text-cream" : "text-brown-soft hover:bg-brown/5 hover:text-brown"
            }`}
          >
            {t.nav[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}

/** "Favorites" link in the top bar, highlighted the same way when active. */
export function FavoritesNavLink() {
  const pathname = usePathname();
  const t = useDictionary();
  const active = isActivePath(pathname, "/favorites");
  return (
    <Link
      href="/favorites"
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 transition-colors ${
        active ? "bg-brown text-cream" : "hover:text-brown"
      }`}
    >
      {t.nav.favorites}
    </Link>
  );
}
