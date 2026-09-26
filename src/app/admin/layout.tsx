import Link from "next/link";
import { Logo } from "@/components/navigation/logo";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getAdminDictionary } from "@/lib/i18n/server";
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
  const [t, settings] = await Promise.all([getAdminDictionary(), getSiteSettings()]);
  const studio = format(t.studio, { site: settings.siteName });

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-56 flex-col border-r border-brown/10 px-5 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 font-display text-2xl text-orange">
          <Logo size={28} />
          {studio}
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-brown-soft transition-colors hover:bg-brown/5 hover:text-brown"
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>
        <LanguageToggle className="mt-auto self-start" />
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
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 text-xs text-brown-soft">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-full border border-brown/15 px-3 py-1.5"
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>
        </header>
        <main className="min-w-0 px-4 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
