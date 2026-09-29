import type { Metadata } from "next";
import { Card, PageHeader, formatDate } from "@/components/admin/store/ui";
import { listOrders, SALE_STATUSES } from "@/lib/store/data";
import { listCustomers } from "@/lib/store/customers";
import { formatRupiah } from "@/lib/store/money";
import { whatsappLink } from "@/lib/store/whatsapp";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import { adminSession } from "@/lib/auth";
import { isSuperadminEmail } from "@/config/admins";
import { RoleSelect } from "@/components/admin/store/role-select";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.customers.title };
}

export default async function CustomersPage() {
  const [t, locale, customers, orders, session] = await Promise.all([
    getStoreDictionary(),
    getLocale(),
    listCustomers(),
    listOrders(),
    adminSession(),
  ]);
  const c = t.admin.customers;
  const statsFor = (id: string) => {
    const own = orders.filter((o) => o.customerId === id && o.status !== "cancelled");
    return {
      orders: own.length,
      spent: own.filter((o) => SALE_STATUSES.includes(o.status)).reduce((s, o) => s + o.total, 0),
    };
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title={c.title} />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{c.intro}</p>
      <Card className="!p-0">
        {customers.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{c.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-brown-soft">
                <tr className="border-b border-brown/10">
                  <th className="px-4 py-2.5 font-medium">{c.name}</th>
                  <th className="px-4 py-2.5 font-medium">{c.email}</th>
                  <th className="px-4 py-2.5 font-medium">{c.phone}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.orders}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.spent}</th>
                  <th className="px-4 py-2.5 font-medium">{c.joined}</th>
                  <th className="px-4 py-2.5 font-medium">{c.role}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10">
                {customers.map((cu) => {
                  const stats = statsFor(cu._id);
                  return (
                    <tr key={cu._id}>
                      <td className="px-4 py-3 font-medium text-brown">{cu.name}</td>
                      <td className="px-4 py-3 text-brown-soft">{cu.email}</td>
                      <td className="px-4 py-3">
                        {cu.phone ? (
                          <a
                            href={whatsappLink(cu.phone, `Halo ${cu.name}, `)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange hover:underline"
                          >
                            {cu.phone}
                          </a>
                        ) : (
                          <span className="text-brown-soft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-brown">{stats.orders}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-brown">{formatRupiah(stats.spent)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-brown-soft">{formatDate(cu.createdAt, locale, false)}</td>
                      <td className="px-4 py-3">
                        <RoleSelect
                          id={cu._id}
                          role={cu.role ?? "customer"}
                          locked={isSuperadminEmail(cu.email) ? "superadmin" : cu._id === session?.customerId ? "you" : undefined}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
