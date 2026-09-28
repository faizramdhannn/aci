import Link from "next/link";
import { Logo } from "@/components/navigation/logo";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { AdminNav, type AdminNavGroup } from "@/components/admin/admin-nav";
import { getAdminDictionary, getStoreDictionary } from "@/lib/i18n/server";
import { listOrders } from "@/lib/store/data";
import { format } from "@/lib/i18n/dictionaries";
import { getSiteSettings } from "@/lib/data";

const adminNavItems = [
  { key: "overview", href: "/admin" },
  { key: "looks", href: "/admin/shoppable-images" },
  { key: "categories", href: "/admin/categories" },
  { key: "analytics", href: "/admin/analytics" },
  { key: "settings", href: "/admin/settings" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [t, st, settings, pending] = await Promise.all([
    getAdminDictionary(),
    getStoreDictionary(),
    getSiteSettings(),
    listOrders({ status: "pending" }),
  ]);
  const studio = format(t.studio, { site: settings.siteName });
  const groups: AdminNavGroup[] = [
    {
      label: st.admin.outfitSection,
      items: adminNavItems.map((item) => ({ href: item.href, label: t.nav[item.key], exact: item.href === "/admin" })),
    },
    {
      label: st.admin.section,
      items: [
        { href: "/admin/store", label: st.admin.nav.home, exact: true },
        { href: "/admin/store/orders", label: st.admin.nav.orders, badge: pending.length },
        { href: "/admin/store/products", label: st.admin.nav.products },
        { href: "/admin/store/customers", label: st.admin.nav.customers },
        { href: "/admin/store/settings", label: st.admin.nav.settings },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-brown/10 px-5 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 font-display text-2xl text-orange">
          <Logo size={28} />
          {studio}
        </Link>
        <AdminNav groups={groups} variant="sidebar" />
        <LanguageToggle className="mt-auto self-start pt-6" />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-brown/10 px-4 py-3 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 font-display text-lg text-orange">
              <Logo size={20} />
              {studio}
            </Link>
            <LanguageToggle />
          </div>
          <AdminNav groups={groups} variant="chips" />
        </header>
        <main className="min-w-0 px-4 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
