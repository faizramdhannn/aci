import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Card, PageHeader, StatusBadge, formatDate, secondaryButton } from "@/components/admin/store/ui";
import { getStoreSettings, listOrders, listStoreProducts, salesSummary } from "@/lib/store/data";
import { formatRupiah } from "@/lib/store/money";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.home.title };
}

const LOW_STOCK = 3;

export default async function StoreHomePage() {
  const [t, locale, settings, orders, products] = await Promise.all([
    getStoreDictionary(),
    getLocale(),
    getStoreSettings(),
    listOrders(),
    listStoreProducts(),
  ]);

  const { today: salesToday, last30: sales30, toConfirm, toShip } = salesSummary(orders);

  const lowStock = products
    .flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })))
    .filter(({ product, variant }) => product.status === "active" && variant.stock <= LOW_STOCK)
    .sort((a, b) => a.variant.stock - b.variant.stock)
    .slice(0, 8);

  const stats = [
    { label: t.admin.home.salesToday, value: formatRupiah(salesToday) },
    { label: t.admin.home.sales30, value: formatRupiah(sales30) },
    { label: t.admin.home.toConfirm, value: toConfirm, href: "/admin/store/orders?status=pending" },
    { label: t.admin.home.toShip, value: toShip, href: "/admin/store/orders?status=paid" },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t.admin.home.title}
        actions={
          <Link href="/narras" target="_blank" className={secondaryButton}>
            {t.admin.home.viewStore}
          </Link>
        }
      />

      {!settings.whatsappNumber && (
        <Link
          href="/admin/store/settings"
          className="mb-6 block rounded-2xl border border-amber-500/40 bg-amber-400/15 px-4 py-3 text-sm text-brown"
        >
          {t.admin.home.setupWhatsapp}
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-xs text-brown-soft">{s.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-brown">{s.value}</p>
            </>
          );
          const cls = "rounded-2xl border border-brown/10 bg-surface p-4 shadow-sm";
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} hover:border-brown/30`}>
              {body}
            </Link>
          ) : (
            <div key={s.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card
          title={t.admin.home.recentOrders}
          action={
            orders.length > 0 && (
              <Link href="/admin/store/orders" className="text-xs font-medium text-orange hover:underline">
                {t.admin.home.viewAll}
              </Link>
            )
          }
        >
          {orders.length === 0 ? (
            <p className="text-sm text-brown-soft">{t.admin.home.noOrders}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-brown/10">
              {orders.slice(0, 6).map((o) => (
                <li key={o._id}>
                  <Link href={`/admin/store/orders/${o._id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-brown/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brown">{o.number}</p>
                      <p className="truncate text-xs text-brown-soft">
                        {o.customer.name} · {formatDate(o.createdAt, locale)}
                      </p>
                    </div>
                    <StatusBadge status={o.status} label={t.statuses[o.status]} />
                    <p className="w-24 text-right text-sm tabular-nums text-brown">{formatRupiah(o.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t.admin.home.lowStock}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-brown-soft">{t.admin.home.noLowStock}</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map(({ product, variant }) => (
                <li key={`${product._id}:${variant.id}`}>
                  <Link href={`/admin/store/products/${product._id}`} className="flex items-center gap-3 hover:opacity-80">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-brown/5">
                      {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="32px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate text-brown">{product.title}</p>
                      <p className="text-xs text-brown-soft">{variant.name}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        variant.stock === 0 ? "bg-red-400/20 text-brown" : "bg-amber-400/25 text-brown"
                      }`}
                    >
                      {variant.stock}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
