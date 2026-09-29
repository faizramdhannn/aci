"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/types/store";
import { useAppPathname } from "@/lib/use-app-pathname";
import { useMe } from "@/lib/use-me";

/**
 * The shopper's cart lives on their account, so it follows them across
 * devices. The server renders it into this provider; changes update the UI
 * immediately and are saved in the background, in order.
 */
export type CartLine = CartItem;

interface CartContextValue {
  lines: CartLine[];
  signedIn: boolean;
  /** False (and sends the visitor to log in) when not signed in. */
  addToCart: (line: CartLine, maxQty: number) => boolean;
  setCartQty: (productId: string, variantId: string, qty: number) => void;
  replaceCart: (lines: CartLine[]) => void;
  /** After checkout: the server already emptied the saved cart. */
  clearCartLocally: () => void;
  loginHref: string;
  wishlist: string[];
  /** Signed-in account's name, once /api/me has answered. */
  accountName?: string;
  /** False until we know whether someone is signed in. */
  known: boolean;
  /** Returns the new state (true = saved), or null when sent to log in. */
  toggleWishlist: (productId: string) => boolean | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Pages are cached for everyone; the account's saved cart and wishlist come
  // from /api/me in the browser. Local edits take over from then on.
  const me = useMe();
  const signedIn = Boolean(me?.signedIn);
  const [localLines, setLines] = useState<CartLine[] | null>(null);
  const [localWishlist, setWishlist] = useState<string[] | null>(null);
  const lines = localLines ?? me?.cart ?? [];
  const wishlist = localWishlist ?? me?.wishlist ?? [];
  const router = useRouter();
  const pathname = useAppPathname();
  const saving = useRef(Promise.resolve());
  const loginHref = `/narras/login?callbackUrl=${encodeURIComponent(pathname)}`;

  const save = useCallback((next: CartLine[]) => {
    setLines(next);
    saving.current = saving.current.then(() =>
      fetch("/api/store/account/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).then(
        () => undefined,
        () => undefined
      )
    );
  }, []);

  const value: CartContextValue = {
    lines,
    signedIn,
    loginHref,
    addToCart(line, maxQty) {
      if (!signedIn) {
        router.push(loginHref);
        return false;
      }
      const next = [...lines];
      const i = next.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
      if (i >= 0) next[i] = { ...next[i], qty: Math.min(maxQty, next[i].qty + line.qty) };
      else next.push({ ...line, qty: Math.min(maxQty, line.qty) });
      save(next);
      return true;
    },
    setCartQty(productId, variantId, qty) {
      save(
        lines
          .map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty } : l))
          .filter((l) => l.qty > 0)
      );
    },
    replaceCart: save,
    clearCartLocally: () => setLines([]),
    accountName: me?.name,
    known: me !== null,
    wishlist,
    toggleWishlist(productId) {
      if (!signedIn) {
        router.push(loginHref);
        return null;
      }
      const saved = !wishlist.includes(productId);
      setWishlist(saved ? [productId, ...wishlist] : wishlist.filter((p) => p !== productId));
      fetch("/api/store/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((list: string[] | null) => list && setWishlist(list))
        .catch(() => undefined);
      return saved;
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside <CartProvider>");
  return ctx;
}

export function useCart(): CartLine[] {
  return useCartContext().lines;
}
