import type { Dictionary } from "@/lib/i18n/dictionaries";

type NavKey = keyof Dictionary["nav"];

// Admin is deliberately absent from public navigation — it's reached by
// going to /admin directly.
export const desktopNavItems: { key: NavKey; href: string }[] = [
  { key: "home", href: "/outfit" },
  { key: "shop", href: "/shop" },
  { key: "categories", href: "/categories" },
];

export const mobileNavItems = [
  { key: "home", href: "/outfit", icon: "home" },
  { key: "explore", href: "/shop", icon: "explore" },
  { key: "categories", href: "/categories", icon: "grid" },
  { key: "favorites", href: "/favorites", icon: "heart" },
] as const satisfies readonly { key: NavKey; href: string; icon: string }[];

/** The umbrella brand: splash wordmark and the hub page that links both sites. */
export const HUB_NAME = "narras";
