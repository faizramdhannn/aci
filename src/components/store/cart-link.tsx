"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";

export function CartLink() {
  const t = useStoreDictionary();
  const count = useCart().reduce((sum, l) => sum + l.qty, 0);
  return (
    <Link
      href="/narras/cart"
      aria-label={`${t.store.nav.cart} (${count})`}
      className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-brown hover:bg-brown/5"
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden sm:inline">{t.store.nav.cart}</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[11px] font-semibold text-cream">
          {count}
        </span>
      )}
    </Link>
  );
}
