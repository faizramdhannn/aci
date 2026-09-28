"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Images,
  House,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Star,
  Store,
  Tag,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";

// Icons are referenced by name: component references can't cross from the server layout.
const ICONS = {
  dashboard: LayoutDashboard,
  orders: Receipt,
  products: Package,
  collections: Layers,
  customers: Users,
  vouchers: TicketPercent,
  reviews: Star,
  settings: Settings,
  home: House,
  looks: Images,
  categories: Tag,
  analytics: BarChart3,
  front: LayoutTemplate,
  comments: MessageSquare,
  store: Store,
} satisfies Record<string, LucideIcon>;

export type AdminNavIcon = keyof typeof ICONS;

export interface AdminNavGroup {
  label: string;
  items: { href: string; label: string; icon: AdminNavIcon; badge?: number; exact?: boolean }[];
}

/** Sidebar (desktop) or chip row (mobile) of grouped admin links with the current page highlighted. */
export function AdminNav({ groups, variant }: { groups: AdminNavGroup[]; variant: "sidebar" | "chips" }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "chips") {
    return (
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 text-xs">
        {groups.map((group, g) => (
          <div key={group.label} className="flex shrink-0 items-center gap-1">
            {g > 0 && <span className="mx-1 h-4 w-px bg-brown/20" aria-hidden />}
            {group.items.map((item) => {
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
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col text-sm">
      {groups.map((group, g) => (
        <div key={group.label} className={g > 0 ? "mt-4 border-t border-brown/10 pt-4" : ""}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-brown-soft/70">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors ${
                    active ? "bg-brown/10 font-semibold text-brown" : "text-brown-soft hover:bg-brown/5 hover:text-brown"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-orange" : ""}`} />
                  <span className="flex-1 truncate">{item.label}</span>
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
