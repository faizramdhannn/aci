import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { customerId } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";
import { getStoreProductsByIds, listOrdersForCustomer } from "@/lib/store/data";
import { ProductCard } from "@/components/store/product-card";
import { formatRupiah } from "@/lib/store/money";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";
import { AddressBook, LogoutButton, PasswordForm, ProfileForm } from "@/components/store/account/account-forms";

export const dynamic = "force-dynamic";

const TABS = ["orders", "wishlist", "profile", "addresses", "security"] as const;
type Tab = (typeof TABS)[number];

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).account.myAccount, robots: { index: false } };
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const raw = (await searchParams).tab;
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "orders";
  const id = await customerId();
  if (!id) redirect(`/narras/login?callbackUrl=${encodeURIComponent(`/narras/account?tab=${tab}`)}`);
  const [customer, orders, dict, locale] = await Promise.all([
    getCustomerById(id),
    listOrdersForCustomer(id),
    getStoreDictionary(),
    getLocale(),
  ]);
  if (!customer) redirect("/narras/login?callbackUrl=/narras/account");
  const wishlistIds = customer.wishlist ?? [];
  const wished =
    tab === "wishlist"
      ? (await getStoreProductsByIds(wishlistIds))
          .filter((p) => p.status === "active")
          .sort((a, b) => wishlistIds.indexOf(a._id) - wishlistIds.indexOf(b._id))
      : [];
  const t = dict.account;
  const date = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brown">{format(t.hello, { name: customer.name.split(" ")[0] })}</h1>
          <p className="text-sm text-brown-soft">{customer.email}</p>
        </div>
        <LogoutButton label={t.logout} />
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-brown/10">
        {TABS.map((key) => (
          <Link
            key={key}
            href={`/narras/account?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 pb-2 text-sm font-medium ${
              tab === key ? "border-brown text-brown" : "border-transparent text-brown-soft hover:text-brown"
            }`}
          >
            {t.tabs[key]}
          </Link>
        ))}
      </nav>

      {tab === "orders" &&
        (orders.length === 0 ? (
          <p className="text-sm text-brown-soft">{t.noOrders}</p>
        ) : (
          <ul className="divide-y divide-brown/10 rounded-2xl border border-brown/10 bg-surface">
            {orders.map((o) => (
              <li key={o._id}>
                <Link href={`/narras/order/${o._id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brown/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brown">{o.number}</p>
                    <p className="truncate text-xs text-brown-soft">
                      {date.format(new Date(o.createdAt))} · {o.items.map((i) => `${i.title} (${i.variantName})`).join(", ")}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-brown/10 px-2.5 py-0.5 text-xs text-brown sm:inline">{dict.statuses[o.status]}</span>
                  <span className="w-24 text-right text-sm tabular-nums text-brown">{formatRupiah(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ))}

      {tab === "wishlist" &&
        (wished.length === 0 ? (
          <p className="text-sm text-brown-soft">{t.wishlistEmpty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {wished.map((p) => (
              <ProductCard key={p._id} product={p} t={dict} />
            ))}
          </div>
        ))}

      {tab === "profile" && <ProfileForm name={customer.name} phone={customer.phone} email={customer.email} />}

      {tab === "addresses" && (
        <AddressBook
          addresses={customer.addresses}
          defaultAddressId={customer.defaultAddressId}
          fallback={{ recipient: customer.name, phone: customer.phone }}
        />
      )}

      {tab === "security" && <PasswordForm hasPassword={Boolean(customer.passwordHash)} />}
    </main>
  );
}
