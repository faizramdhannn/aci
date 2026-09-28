"use client";

import { Heart } from "lucide-react";
import { useCartContext } from "@/lib/store/cart";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

/** Heart toggle; sends guests to log in. `overlay` sits on a product photo. */
export function WishlistButton({ productId, overlay = false }: { productId: string; overlay?: boolean }) {
  const t = useStoreDictionary().store;
  const toast = useToast();
  const { wishlist, toggleWishlist } = useCartContext();
  const saved = wishlist.includes(productId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t.wishlistRemove : t.wishlistAdd}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (toggleWishlist(productId)) toast(t.wishlistAdded);
      }}
      className={
        overlay
          ? "flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-black shadow-sm backdrop-blur transition hover:scale-105"
          : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brown/20 text-brown transition hover:bg-brown/5"
      }
    >
      <Heart className={`h-5 w-5 ${saved ? "fill-orange text-orange" : ""}`} />
    </button>
  );
}
