import { getSiteSettings } from "@/lib/data";
import { getHubSettings, getStoreSettings } from "@/lib/store/data";
import { SiteSwitcherMenu, type SiteOption } from "@/components/navigation/site-switcher-menu";

/** Server wrapper: loads both sites' names and logos for the switcher. */
export async function SiteSwitcher({ current, compact }: { current: SiteOption["key"]; compact?: boolean }) {
  const [site, store, hub] = await Promise.all([getSiteSettings(), getStoreSettings(), getHubSettings()]);
  const sites: SiteOption[] = [
    { key: "outfit", name: site.siteName, href: "/outfit", logo: "/aci-logo.png" },
    { key: "store", name: store.storeName, href: "/narras", logo: hub.storeLogo || undefined },
  ];
  return <SiteSwitcherMenu sites={sites} current={current} compact={compact} />;
}
