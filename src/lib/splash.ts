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

/**
 * Runs in <head> before first paint: marks which intros were already seen
 * (data-splash-seen="outfit store") so CSS can hide a cached page's splash
 * immediately instead of flashing it until hydration.
 */
export const SPLASH_SEEN_SCRIPT = `(function(){try{var c=document.cookie,s=[];${Object.entries(SPLASH_COOKIES)
  .map(([brand, name]) => `if(c.indexOf("${name}=")>-1)s.push("${brand}");`)
  .join("")}document.documentElement.setAttribute("data-splash-seen",s.join(" "))}catch(e){}})()`;
