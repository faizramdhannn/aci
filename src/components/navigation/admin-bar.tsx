"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";

/**
 * Shopify-style strip shown to signed-in admins while they browse the public
 * sites, with a shortcut to the matching part of the dashboard.
 */
export function AdminBar({ email }: { email: string }) {
  const t = useStoreDictionary().adminBar;
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const dashboard = pathname.startsWith("/narras") ? "/admin/store" : "/admin";

  return (
    <div className="relative z-[60] bg-[#1a1a1a] text-white print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 text-xs sm:px-6">
        <span className="min-w-0 truncate text-white/70">
          {t.signedIn} <span className="font-medium text-white">{email}</span>
        </span>
        <Link
          href={dashboard}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold text-black hover:bg-white/90"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          {t.open}
        </Link>
      </div>
    </div>
  );
}
