"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CartItem } from "@/types/store";

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
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initial,
  signedIn,
  children,
}: {
  initial: CartLine[];
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const [lines, setLines] = useState(initial);
  const router = useRouter();
  const pathname = usePathname();
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
