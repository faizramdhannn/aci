"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readAuthHint } from "@/lib/auth-hint";
import type { CartItem } from "@/types/store";

export interface Me {
  signedIn: boolean;
  isAdmin?: boolean;
  email?: string;
  name?: string;
  cart?: CartItem[];
  wishlist?: string[];
}

/**
 * The signed-in account on cached pages, fetched once per page load and
 * shared by every component that asks (header, cart, admin bar). Guests
 * never trigger a request: the narras_auth hint cookie says nobody's signed in.
 */
let current: Me | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  if (loading) return;
  if (!readAuthHint()) {
    current = { signedIn: false };
    listeners.forEach((l) => l());
    return;
  }
  loading = fetch("/api/me", { cache: "no-store" })
    .then((r) => r.json())
    .then((me: Me) => {
      current = me;
    })
    .catch(() => {
      current = { signedIn: false };
    })
    .finally(() => listeners.forEach((l) => l()));
}

/** null until known (first render, or while loading). */
export function useMe(): Me | null {
  const me = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null
  );
  useEffect(() => {
    load();
  }, []);
  return me;
}
