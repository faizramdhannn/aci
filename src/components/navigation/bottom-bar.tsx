"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "@/config/site";
import { NavIcon } from "@/components/navigation/nav-icon";
import { useDictionary } from "@/components/i18n/locale-provider";

export function BottomBar() {
  const pathname = usePathname();
  const t = useDictionary();

  return (
    <nav
      className="glass-dark fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-3xl px-2 py-2 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {mobileNavItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] transition-colors ${
              active ? "text-yellow" : "text-cream/70"
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
