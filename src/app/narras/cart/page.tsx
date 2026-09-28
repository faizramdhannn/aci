import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { getStoreDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).store.cartTitle, robots: { index: false } };
}

export default async function CartPage() {
  const t = await getStoreDictionary();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-brown">{t.store.cartTitle}</h1>
      <CartView />
    </main>
  );
}
