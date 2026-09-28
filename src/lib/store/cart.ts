"use client";

import { useSyncExternalStore } from "react";

/** One line in the visitor's cart. Only ids and quantity — prices are always re-read from the server. */
export interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

const KEY = "narras-cart";
const EVENT = "narras-cart-change";
const EMPTY: CartLine[] = [];

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedLines;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    cachedLines = Array.isArray(parsed)
      ? parsed.filter(
          (l): l is CartLine =>
            typeof l?.productId === "string" && typeof l?.variantId === "string" && Number.isInteger(l?.qty) && l.qty > 0
        )
      : EMPTY;
  } catch {
    cachedLines = EMPTY;
  }
  return cachedLines;
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage blocked — the cart just won't persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addToCart(line: CartLine, maxQty: number) {
  const lines = [...read()];
  const i = lines.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
  if (i >= 0) lines[i] = { ...lines[i], qty: Math.min(maxQty, lines[i].qty + line.qty) };
  else lines.push({ ...line, qty: Math.min(maxQty, line.qty) });
  write(lines);
}

export function setCartQty(productId: string, variantId: string, qty: number) {
  write(
    read()
      .map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty } : l))
      .filter((l) => l.qty > 0)
  );
}

export function replaceCart(lines: CartLine[]) {
  write(lines);
}

export function clearCart() {
  write([]);
}
