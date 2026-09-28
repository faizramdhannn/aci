import type { Metadata } from "next";
import { Card, PageHeader, formatDate } from "@/components/admin/store/ui";
import { customersFromOrders, listOrders } from "@/lib/store/data";
import { formatRupiah } from "@/lib/store/money";
import { whatsappLink } from "@/lib/store/whatsapp";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.customers.title };
}

export default async function CustomersPage() {
  const [t, locale, orders] = await Promise.all([getStoreDictionary(), getLocale(), listOrders()]);
  const customers = customersFromOrders(orders);
  const c = t.admin.customers;

  return (
    <div className="max-w-5xl">
      <PageHeader title={c.title} />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{c.intro}</p>
      <Card className="!p-0">
        {customers.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{c.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-brown-soft">
                <tr className="border-b border-brown/10">
                  <th className="px-4 py-2.5 font-medium">{c.name}</th>
                  <th className="px-4 py-2.5 font-medium">{c.phone}</th>
                  <th className="px-4 py-2.5 font-medium">{c.city}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.orders}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.spent}</th>
                  <th className="px-4 py-2.5 font-medium">{c.last}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10">
                {customers.map((cu) => (
                  <tr key={cu.phone}>
                    <td className="px-4 py-3 font-medium text-brown">{cu.name}</td>
                    <td className="px-4 py-3">
                      <a href={whatsappLink(cu.phone, `Halo ${cu.name}, `)} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline">
                        {cu.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-brown-soft">{cu.city}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-brown">{cu.orders}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-brown">{formatRupiah(cu.spent)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-brown-soft">{formatDate(cu.lastOrderAt, locale, false)}</td>
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
