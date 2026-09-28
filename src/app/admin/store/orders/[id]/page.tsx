import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, StatusBadge, formatDate, secondaryButton } from "@/components/admin/store/ui";
import { OrderActions } from "@/components/admin/store/order-actions";
import { getOrderById } from "@/lib/store/data";
import { formatRupiah } from "@/lib/store/money";
import { whatsappLink } from "@/lib/store/whatsapp";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const order = await getOrderById((await params).id);
  return { title: order?.number ?? "Order" };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, t, locale] = await Promise.all([getOrderById(id), getStoreDictionary(), getLocale()]);
  if (!order) notFound();
  const c = order.customer;

  return (
    <div className="max-w-5xl">
      <PageHeader
        back={{ href: "/admin/store/orders", label: t.admin.orders.back }}
        actions={
          <Link href={`/admin/store/labels?ids=${order._id}`} className={secondaryButton}>
            {t.admin.labels.print}
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.number}
            <StatusBadge status={order.status} label={t.statuses[order.status]} />
          </span>
        }
      />
      <p className="-mt-4 mb-6 text-xs text-brown-soft">
        {format(t.admin.orders.timeline, { date: formatDate(order.createdAt, locale) })}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title={t.admin.orders.itemsTitle}>
            <ul className="divide-y divide-brown/10">
              {order.items.map((item) => (
                <li key={`${item.productId}:${item.variantId}`} className="flex items-center gap-3 py-2.5">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-brown/5">
                    {item.image && <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-brown">{item.title}</p>
                    <p className="text-xs text-brown-soft">{item.variantName}</p>
                  </div>
                  <p className="text-sm tabular-nums text-brown-soft">
                    {formatRupiah(item.price)} × {item.qty}
                  </p>
                  <p className="w-24 text-right text-sm tabular-nums text-brown">{formatRupiah(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-brown/10 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brown-soft">{t.admin.orders.subtotal}</dt>
                <dd className="tabular-nums text-brown">{formatRupiah(order.subtotal)}</dd>
              </div>
              {order.discount ? (
                <div className="flex justify-between">
                  <dt className="text-brown-soft">
                    {t.store.discount} ({order.voucherCode})
                  </dt>
                  <dd className="tabular-nums text-brown">−{formatRupiah(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-brown-soft">{t.admin.orders.shipping}</dt>
                <dd className="tabular-nums text-brown">
                  {order.shippingCost != null ? formatRupiah(order.shippingCost) : "—"}
                </dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt className="text-brown">{t.admin.orders.total2}</dt>
                <dd className="tabular-nums text-brown">{formatRupiah(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <OrderActions order={order} />
        </div>

        <div className="space-y-6">
          <Card title={t.admin.orders.customerTitle}>
            <p className="text-sm font-medium text-brown">{c.name}</p>
            <p className="text-sm text-brown-soft">{c.phone}</p>
            <a
              href={whatsappLink(c.phone, `Halo ${c.name}, terkait pesanan ${order.number} di by.narras:`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              {t.admin.orders.chat}
            </a>
          </Card>
          <Card title={t.admin.orders.address}>
            <p className="whitespace-pre-line text-sm text-brown">
              {c.name}
              {"\n"}
              {c.address}
              {"\n"}
              {c.city} {c.postalCode}
            </p>
          </Card>
          {c.note && (
            <Card title={t.admin.orders.note}>
              <p className="whitespace-pre-line text-sm text-brown">{c.note}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
