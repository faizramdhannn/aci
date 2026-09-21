import Link from "next/link";

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Shoppable Images", href: "/admin/shoppable-images" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Analytics", href: "/admin/analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-56 flex-col border-r border-brown/10 px-5 py-6 md:flex">
        <Link href="/" className="mb-8 font-display text-2xl text-orange">
          Aci Studio
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-brown-soft transition-colors hover:bg-brown/5 hover:text-brown"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-brown/10 px-5 py-4 md:hidden">
          <span className="font-display text-xl text-orange">Aci Studio</span>
          <nav className="flex gap-3 text-xs text-brown-soft">
            {adminNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-5 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
