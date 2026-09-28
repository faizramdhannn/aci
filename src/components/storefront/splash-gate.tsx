"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@/components/storefront/splash-screen";
import { SPLASH_COOKIES, SWITCH_SITE_EVENT, splashBrandFor, type SplashBrand } from "@/lib/splash";

/**
 * Plays the intro of the section being entered — "acishop" for Spill Outfit,
 * "by.narras" for the store. It shows once per browser session per section
 * when arriving normally, and every time the visitor switches sites from the
 * logo switcher (which fires SWITCH_SITE_EVENT). The hub and admin get none.
 */
export function SplashGate({ words, seen }: { words: Record<SplashBrand, string>; seen: SplashBrand[] }) {
  const brand = splashBrandFor(usePathname());
  const [done, setDone] = useState<SplashBrand[]>(seen);
  const [replay, setReplay] = useState<{ brand: SplashBrand; n: number } | null>(null);

  useEffect(() => {
    const onSwitch = (e: Event) => {
      const target = (e as CustomEvent<SplashBrand>).detail;
      setReplay({ brand: target, n: Date.now() });
    };
    window.addEventListener(SWITCH_SITE_EVENT, onSwitch);
    return () => window.removeEventListener(SWITCH_SITE_EVENT, onSwitch);
  }, []);

  // Switching: cover the page straight away, while the other site loads underneath.
  if (replay) {
    return (
      <SplashScreen
        key={`${replay.brand}-${replay.n}`}
        word={words[replay.brand]}
        cookieName={SPLASH_COOKIES[replay.brand]}
        onDone={() => {
          setDone((d) => (d.includes(replay.brand) ? d : [...d, replay.brand]));
          setReplay(null);
        }}
      />
    );
  }

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
