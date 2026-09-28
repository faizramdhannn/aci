import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderById, getStoreSettings } from "@/lib/store/data";
import { formatRupiah } from "@/lib/store/money";
import { orderMessage, whatsappLink } from "@/lib/store/whatsapp";
import { getStoreDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const order = await getOrderById((await params).id);
  return { title: order?.number, robots: { index: false } };
}

/** The buyer's receipt. The URL holds the order's random id, so only people given the link can see it. */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings, t] = await Promise.all([getOrderById(id), getStoreSettings(), getStoreDictionary()]);
  if (!order) notFound();

  const whatsappUrl = settings.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, orderMessage(order, `${siteUrl}/narras/order/${order._id}`))
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brown">{format(t.store.orderTitle, { number: order.number })}</h1>
      {order.status === "pending" && (
        <>
          <p className="mt-2 text-sm text-brown-soft">{whatsappUrl ? t.store.orderIntro : t.store.noWhatsapp}</p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              {t.store.sendWhatsapp}
            </a>
          )}
        </>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-brown/10 bg-surface p-5 text-sm">
        <div>
          <dt className="text-brown-soft">{t.store.orderStatus}</dt>
          <dd className="font-semibold text-brown">{t.statuses[order.status]}</dd>
        </div>
        {order.trackingNumber && (
          <div>
            <dt className="text-brown-soft">{t.store.tracking}</dt>
            <dd className="font-semibold text-brown">
              {order.courier ? `${order.courier} · ` : ""}
              {order.trackingNumber}
            </dd>
          </div>
        )}
      </dl>

      <ul className="mt-6 divide-y divide-brown/10">
        {order.items.map((item) => (
          <li key={`${item.productId}:${item.variantId}`} className="flex items-center gap-4 py-3">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-brown/5">
              {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-brown">{item.title}</p>
              <p className="text-brown-soft">
                {item.variantName} × {item.qty}
              </p>
            </div>
            <p className="text-sm font-medium text-brown">{formatRupiah(item.price * item.qty)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 border-t border-brown/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-brown-soft">{t.store.subtotal}</dt>
          <dd className="text-brown">{formatRupiah(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-brown-soft">{t.store.shipping}</dt>
          <dd className="text-brown">
            {order.shippingCost != null ? formatRupiah(order.shippingCost) : t.store.shippingPending}
          </dd>
        </div>
        <div className="flex justify-between pt-1 text-base font-semibold">
          <dt className="text-brown">{t.store.total}</dt>
          <dd className="text-brown">{formatRupiah(order.total)}</dd>
        </div>
      </dl>

      {settings.paymentInfo && order.status !== "cancelled" && (
        <section className="mt-8 rounded-2xl bg-yellow/15 p-5 text-sm">
          <h2 className="mb-1 font-semibold text-brown">{t.store.paymentInfo}</h2>
          <p className="whitespace-pre-line text-brown">{settings.paymentInfo}</p>
        </section>
      )}

      <section className="mt-8 text-sm">
        <h2 className="mb-1 font-semibold text-brown">{t.store.shipTo}</h2>
        <p className="text-brown-soft">
          {order.customer.name}
          <br />
          {order.customer.address}, {order.customer.city} {order.customer.postalCode}
        </p>
      </section>
    </main>
  );
}
