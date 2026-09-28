import Link from "next/link";
import { Logo } from "@/components/navigation/logo";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { AdminNav, type AdminNavGroup } from "@/components/admin/admin-nav";
import { getAdminDictionary, getStoreDictionary } from "@/lib/i18n/server";
import { listOrders } from "@/lib/store/data";
import { format } from "@/lib/i18n/dictionaries";
import { HUB_NAME } from "@/config/site";

const outfitItems = [
  { key: "overview", href: "/admin", icon: "home" },
  { key: "looks", href: "/admin/shoppable-images", icon: "looks" },
  { key: "categories", href: "/admin/categories", icon: "categories" },
  { key: "analytics", href: "/admin/analytics", icon: "analytics" },
  { key: "settings", href: "/admin/settings", icon: "settings" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [t, st, pending] = await Promise.all([
    getAdminDictionary(),
    getStoreDictionary(),
    listOrders({ status: "pending" }),
  ]);
  const studio = format(t.studio, { site: HUB_NAME });
  // The store first (day-to-day work), then the outfit site, then what's shared by both.
  const groups: AdminNavGroup[] = [
    {
      label: st.admin.section,
      items: [
        { href: "/admin/store", label: st.admin.nav.home, icon: "dashboard", exact: true },
        { href: "/admin/store/orders", label: st.admin.nav.orders, icon: "orders", badge: pending.length },
        { href: "/admin/store/products", label: st.admin.nav.products, icon: "products" },
        { href: "/admin/store/collections", label: st.admin.nav.collections, icon: "collections" },
        { href: "/admin/store/customers", label: st.admin.nav.customers, icon: "customers" },
        { href: "/admin/store/vouchers", label: st.admin.nav.vouchers, icon: "vouchers" },
        { href: "/admin/store/reviews", label: st.admin.nav.reviews, icon: "reviews" },
        { href: "/admin/store/settings", label: st.admin.nav.settings, icon: "settings" },
      ],
    },
    {
      label: st.admin.outfitSection,
      items: outfitItems.map((item) => ({
        href: item.href,
        label: t.nav[item.key],
        icon: item.icon,
        exact: item.href === "/admin",
      })),
    },
    {
      label: st.admin.hubSection,
      items: [
        { href: "/admin/hub", label: st.admin.nav.hub, icon: "front" },
        { href: "/admin/comments", label: st.admin.nav.comments, icon: "comments" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 hidden print:!hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-brown/10 px-4 py-6 md:flex">
        <Link href="/admin/store" className="mb-6 flex px-2 items-center gap-2 font-display text-2xl text-orange">
          <Logo size={28} />
          {studio}
        </Link>
        <AdminNav groups={groups} variant="sidebar" />
        <div className="mt-auto flex items-center justify-between border-t border-brown/10 pt-4">
          <LanguageToggle />
          <Link href="/" target="_blank" className="text-xs text-brown-soft hover:text-brown">
            {st.admin.viewSite}
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-brown/10 px-4 py-3 md:hidden print:hidden">
          <div className="mb-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 font-display text-lg text-orange">
              <Logo size={20} />
              {studio}
            </Link>
            <LanguageToggle />
          </div>
          <AdminNav groups={groups} variant="chips" />
        </header>
        <main className="min-w-0 px-4 py-6 md:px-10 md:py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
