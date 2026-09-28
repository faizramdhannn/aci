import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartView } from "@/components/store/cart-view";
import { customerId } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).store.cartTitle, robots: { index: false } };
}

export default async function CartPage() {
  const id = await customerId();
  if (!id) redirect("/narras/login?callbackUrl=/narras/cart");
  const [t, customer] = await Promise.all([getStoreDictionary(), getCustomerById(id)]);
  if (!customer) redirect("/narras/login?callbackUrl=/narras/cart");
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-brown">{t.store.cartTitle}</h1>
      <CartView
        addresses={customer.addresses}
        defaultAddressId={customer.defaultAddressId}
        prefill={{ name: customer.name, phone: customer.phone }}
      />
    </main>
  );
}
