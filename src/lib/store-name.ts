import type { Hotspot, MarketplaceName } from "@/types";

const LABELS: Record<MarketplaceName, string> = {
  shopee: "Shopee",
  tokopedia: "Tokopedia",
  "tiktok-shop": "TikTok Shop",
  lazada: "Lazada",
  instagram: "Instagram",
  other: "",
};

const HOSTS: [RegExp, string][] = [
  [/shopee\./i, "Shopee"],
  [/tokopedia\.|tokopedia\.link/i, "Tokopedia"],
  [/tiktok\.com/i, "TikTok Shop"],
  [/lazada\./i, "Lazada"],
  [/instagram\.com/i, "Instagram"],
  [/zalora\./i, "Zalora"],
  [/blibli\./i, "Blibli"],
];

/** Human store name for a product link: explicit marketplace if set, else guessed from the URL's host. */
export function storeNameFor(hotspot: Pick<Hotspot, "marketplace" | "affiliateUrl">): string | null {
  if (hotspot.marketplace && LABELS[hotspot.marketplace]) return LABELS[hotspot.marketplace];
  try {
    const host = new URL(hotspot.affiliateUrl).hostname;
    return HOSTS.find(([re]) => re.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}
