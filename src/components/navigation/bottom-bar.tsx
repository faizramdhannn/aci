"use client";

import Link from "next/link";
import { mobileNavItems } from "@/config/site";
import { NavIcon } from "@/components/navigation/nav-icon";
import { useDictionary } from "@/components/i18n/locale-provider";
import { isActivePath } from "@/components/navigation/desktop-nav-links";
import { useAppPathname } from "@/lib/use-app-pathname";

export function BottomBar() {
  const pathname = useAppPathname();
  const t = useDictionary();

  return (
    <nav
      className="glass-dark fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-3xl px-2 py-2 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {mobileNavItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] transition-colors ${
              active ? "bg-cream/15 font-semibold text-yellow" : "text-cream/70"
            }`}
          >
            <NavIcon name={item.icon} active={active} />
            {t.nav[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
