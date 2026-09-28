"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminNavGroup {
  label: string;
  items: { href: string; label: string; badge?: number; exact?: boolean }[];
}

/** Sidebar (desktop) or chip row (mobile) of grouped admin links with the current page highlighted. */
export function AdminNav({ groups, variant }: { groups: AdminNavGroup[]; variant: "sidebar" | "chips" }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "chips") {
    return (
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 text-xs">
        {groups.flatMap((g) => g.items).map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 ${
                active ? "border-brown bg-brown text-cream" : "border-brown/15 text-brown-soft"
              }`}
            >
              {item.label}
              {item.badge ? ` (${item.badge})` : ""}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-5 text-sm">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-brown-soft/80">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 transition-colors ${
                    active ? "bg-brown/10 font-semibold text-brown" : "text-brown-soft hover:bg-brown/5 hover:text-brown"
                  }`}
                >
                  {item.label}
                  {item.badge ? (
                    <span className="rounded-full bg-orange px-2 text-[11px] font-semibold text-cream">{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
