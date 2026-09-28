/** Which intro a path gets: none on the hub and admin, otherwise the brand of that section. */
export type SplashBrand = "outfit" | "store";

/** Session cookie (no max-age) per brand, marking that its intro was already shown in this browser session. */
export const SPLASH_COOKIES: Record<SplashBrand, string> = {
  outfit: "aci_splash_outfit",
  store: "aci_splash_store",
};

export function splashBrandFor(pathname: string): SplashBrand | null {
  if (pathname === "/" || pathname.startsWith("/admin")) return null;
  return pathname === "/narras" || pathname.startsWith("/narras/") ? "store" : "outfit";
}

/** Fired by the logo switcher with the target brand, so its intro plays even if already seen. */
export const SWITCH_SITE_EVENT = "narras:switch-site";
