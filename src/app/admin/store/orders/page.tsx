import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader, StatusBadge, formatDate } from "@/components/admin/store/ui";
import { listOrders } from "@/lib/store/data";
import { formatRupiah } from "@/lib/store/money";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import { ORDER_STATUSES, type OrderStatus } from "@/types/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.orders.title };
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;
  const [t, locale, all] = await Promise.all([getStoreDictionary(), getLocale(), listOrders()]);
  const orders = status ? all.filter((o) => o.status === status) : all;
  const count = (s: OrderStatus) => all.filter((o) => o.status === s).length;

  const tabs: { href: string; label: string; active: boolean }[] = [
    { href: "/admin/store/orders", label: `${t.admin.orders.all} (${all.length})`, active: !status },
    ...ORDER_STATUSES.map((s) => ({
      href: `/admin/store/orders?status=${s}`,
      label: `${t.statuses[s]} (${count(s)})`,
      active: status === s,
    })),
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader title={t.admin.orders.title} />
      <Card className="!p-0">
        <nav className="flex gap-1 overflow-x-auto border-b border-brown/10 px-3 pt-3">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 pb-2 text-xs font-medium ${
                tab.active ? "border-brown text-brown" : "border-transparent text-brown-soft hover:text-brown"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {orders.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{t.admin.orders.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-brown-soft">
                <tr className="border-b border-brown/10">
                  <th className="px-4 py-2.5 font-medium">{t.admin.orders.order}</th>
                  <th className="px-4 py-2.5 font-medium">{t.admin.orders.date}</th>
                  <th className="px-4 py-2.5 font-medium">{t.admin.orders.customer}</th>
                  <th className="px-4 py-2.5 font-medium">{t.admin.orders.status}</th>
                  <th className="px-4 py-2.5 font-medium">{t.admin.orders.items}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t.admin.orders.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10">
                {orders.map((o) => (
                  <tr key={o._id} className="relative hover:bg-brown/5">
                    <td className="px-4 py-3 font-semibold text-brown">
                      <Link href={`/admin/store/orders/${o._id}`} className="after:absolute after:inset-0">
                        {o.number}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-brown-soft">{formatDate(o.createdAt, locale)}</td>
                    <td className="px-4 py-3 text-brown">{o.customer.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} label={t.statuses[o.status]} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-brown-soft">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-brown">{formatRupiah(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
