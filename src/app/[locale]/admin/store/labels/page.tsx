import type { Metadata } from "next";
import { PageHeader, primaryButton } from "@/components/admin/store/ui";
import { PrintButton } from "@/components/admin/store/print-button";
import { getOrderById, getStoreSettings, listOrders } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";
import { code128Svg, qrSvg } from "@/lib/store/codes";
import { siteUrl } from "@/lib/site-url";
import { ORDER_STATUSES, type OrderStatus, type StoreOrder } from "@/types/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.labels.printAll };
}

/** Printable 10 × 10 cm shipping labels: ?ids=a,b for specific orders, or ?status=paid for all in a status. */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string; status?: string }> }) {
  const { ids, status } = await searchParams;
  const [t, settings] = await Promise.all([getStoreDictionary(), getStoreSettings()]);
  let orders: StoreOrder[];
  if (ids) {
    orders = (await Promise.all(ids.split(",").slice(0, 200).map((id) => getOrderById(id)))).filter(
      (o): o is StoreOrder => Boolean(o)
    );
  } else {
    const s = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : "paid";
    orders = (await listOrders({ status: s })).reverse();
  }
  const l = t.admin.labels;

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          back={{ href: "/admin/store/orders", label: t.admin.orders.back }}
          title={`${l.printAll} (${orders.length})`}
          actions={<PrintButton label={l.print} className={primaryButton} />}
        />
        <p className="-mt-4 mb-6 text-sm text-brown-soft">{l.hint}</p>
      </div>

      <div className="flex flex-wrap gap-4 print:block print:gap-0">
        {orders.map((o) => (
          <article
            key={o._id}
            className="flex h-[10cm] w-[10cm] flex-col border-2 border-black bg-white p-[0.5cm] text-[11pt] leading-snug text-black print:mb-0 print:break-after-page"
          >
            <div className="flex items-baseline justify-between border-b-2 border-black pb-1">
              <span className="text-[14pt] font-bold">{settings.storeName}</span>
              <span className="font-mono text-[12pt] font-bold">{o.number}</span>
            </div>
            {/* Barcode of the order number (for scanners), QR opening the order in the admin (for phones). */}
            <div
              className="mt-2 h-[1.2cm] w-full [&>svg]:h-full [&>svg]:w-full"
              aria-label={o.number}
              dangerouslySetInnerHTML={{ __html: code128Svg(o.number) }}
            />
            <div className="mt-2 flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[8pt] font-semibold uppercase">{l.to}</p>
              <p className="text-[13pt] font-bold leading-tight">{o.customer.name}</p>
              <p className="font-semibold">{o.customer.phone}</p>
              <p className="mt-0.5 line-clamp-3 text-[10pt]">{o.customer.address}</p>
              <p className="font-semibold">
                {o.customer.city} {o.customer.postalCode}
              </p>
            </div>
            <div
              className="h-[2.2cm] w-[2.2cm] shrink-0 [&>svg]:h-full [&>svg]:w-full"
              aria-label={`QR ${o.number}`}
              dangerouslySetInnerHTML={{ __html: qrSvg(`${siteUrl}/admin/store/orders/${o._id}`) }}
            />
            </div>
            <div className="mt-auto border-t border-black pt-1 text-[9pt]">
              <p>
                <span className="font-semibold">{l.from}:</span> {settings.storeName}
                {settings.whatsappNumber ? ` · ${settings.whatsappNumber}` : ""}
              </p>
              <p className="line-clamp-2">
                <span className="font-semibold">{l.items}:</span>{" "}
                {o.items.map((i) => `${i.title} (${i.variantName}) x${i.qty}`).join(", ")}
              </p>
              {(o.courier || o.trackingNumber) && (
                <p className="font-mono font-semibold">
                  {o.courier} {o.trackingNumber}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
