"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import type { StoreVariant } from "@/types/store";
import { useCartContext } from "@/lib/store/cart";
import { WishlistButton } from "@/components/store/wishlist-button";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { format } from "@/lib/i18n/dictionaries";

/** Variant picker + quantity + add button. The selected variant is owned by the parent (it drives photo and price too). */
export function AddToCart({
  productId,
  variants,
  optionName,
  variantId,
  onVariantChange,
}: {
  productId: string;
  variants: StoreVariant[];
  optionName?: string;
  variantId: string | null;
  onVariantChange: (id: string) => void;
}) {
  const t = useStoreDictionary();
  const toast = useToast();
  const { lines: cart, addToCart } = useCartContext();
  const [qty, setQty] = useState(1);

  const variant = variants.find((v) => v.id === variantId);
  const inCart = cart.find((l) => l.productId === productId && l.variantId === variantId)?.qty ?? 0;
  const available = Math.max(0, (variant?.stock ?? 0) - inCart);
  const allSoldOut = variants.every((v) => v.stock === 0);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-brown">
          {optionName || t.store.colour}
          {variant && <span className="ml-2 font-normal text-brown-soft">{variant.name}</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock === 0}
              onClick={() => {
                onVariantChange(v.id);
                setQty(1);
              }}
              aria-pressed={v.id === variantId}
              className={`flex items-center gap-2 rounded-full border text-sm transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                v.image ? "py-1 pl-1 pr-4" : "px-4 py-2"
              } ${v.id === variantId ? "border-brown bg-brown text-cream" : "border-brown/20 text-brown hover:border-brown/50"}`}
            >
              {v.image && (
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brown/5">
                  <Image src={v.image} alt="" fill sizes="32px" className="object-cover" />
                </span>
              )}
              {v.name}
            </button>
          ))}
        </div>
      </fieldset>

      {variant && (
        <p className="text-xs text-brown-soft">
          {variant.stock <= 5 ? format(t.store.onlyLeft, { n: variant.stock }) : t.store.inStock}
        </p>
      )}

      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-brown/20" aria-label={t.store.quantity}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="p-3 text-brown disabled:opacity-40"
            disabled={qty <= 1}
            aria-label="-"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums text-brown">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(available, q + 1))}
            className="p-3 text-brown disabled:opacity-40"
            disabled={qty >= available}
            aria-label="+"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={!variant || available === 0}
          onClick={() => {
            if (!variant) return;
            if (!addToCart({ productId, variantId: variant.id, qty }, variant.stock)) return;
            setQty(1);
            toast(t.store.added);
          }}
          className="flex-1 rounded-full bg-brown px-6 py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {allSoldOut ? t.store.soldOut : !variant ? t.store.pickVariant : t.store.addToCart}
        </button>
        <WishlistButton productId={productId} />
      </div>
    </div>
  );
}
