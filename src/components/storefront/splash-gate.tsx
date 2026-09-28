"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@/components/storefront/splash-screen";
import { SPLASH_COOKIES, splashBrandFor, type SplashBrand } from "@/lib/splash";

/**
 * Plays the intro of the section being entered — "acishop" for Spill Outfit,
 * "by.narras" for the store — once per browser session each. The hub and
 * admin get none. Works on first load and on client-side navigation from the
 * hub, since the root layout (and this gate) stays mounted between pages.
 */
export function SplashGate({ words, seen }: { words: Record<SplashBrand, string>; seen: SplashBrand[] }) {
  const brand = splashBrandFor(usePathname());
  const [done, setDone] = useState<SplashBrand[]>(seen);

  if (!brand || done.includes(brand)) return null;
  return (
    <SplashScreen
      key={brand}
      word={words[brand]}
      cookieName={SPLASH_COOKIES[brand]}
      onDone={() => setDone((d) => [...d, brand])}
    />
  );
}
