import type { StoreProduct, StoreVariant } from "@/types/store";

/** Pure catalog helpers — safe to import from client components (no database). */

// ── Catalog filtering (search, collection, colour, price, sort) ─────────────

export const SORTS = ["newest", "price-asc", "price-desc", "name"] as const;
export type ProductSort = (typeof SORTS)[number];

export interface ProductQuery {
  q?: string;
  collectionId?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: ProductSort;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim();

/** Every colour name across the catalog, deduplicated case-insensitively, for the filter menu. */
export function colourOptions(products: StoreProduct[]): string[] {
  const seen = new Map<string, string>();
  for (const p of products) for (const v of p.variants) if (!seen.has(norm(v.name))) seen.set(norm(v.name), v.name);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function filterProducts(products: StoreProduct[], query: ProductQuery): StoreProduct[] {
  const words = query.q ? norm(query.q).split(/\s+/).filter(Boolean) : [];
  const colour = query.colour ? norm(query.colour) : "";
  const result = products.filter((p) => {
    if (query.collectionId && !(p.collectionIds ?? []).includes(query.collectionId)) return false;
    if (query.minPrice != null && priceRange(p).min < query.minPrice) return false;
    if (query.maxPrice != null && priceRange(p).min > query.maxPrice) return false;
    const variants = colour ? p.variants.filter((v) => norm(v.name) === colour) : p.variants;
    if (colour && variants.length === 0) return false;
    if (query.inStockOnly && !variants.some((v) => v.stock > 0)) return false;
    if (words.length) {
      const haystack = norm([p.title, p.description, ...p.variants.map((v) => v.name)].join(" "));
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });
  const sort = query.sort ?? "newest";
  return result.sort((a, b) => {
    if (sort === "price-asc") return priceRange(a).min - priceRange(b).min;
    if (sort === "price-desc") return priceRange(b).min - priceRange(a).min;
    if (sort === "name") return a.title.localeCompare(b.title);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Up to `limit` other active products: same collection first, then in-stock, then newest. */
export function relatedProducts(product: StoreProduct, all: StoreProduct[], limit = 4): StoreProduct[] {
  const mine = new Set(product.collectionIds ?? []);
  const score = (p: StoreProduct) =>
    ((p.collectionIds ?? []).some((c) => mine.has(c)) ? 2 : 0) + (p.variants.some((v) => v.stock > 0) ? 1 : 0);
  return all
    .filter((p) => p._id !== product._id && p.status === "active")
    .sort((a, b) => score(b) - score(a) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ── Variant pricing & photos (Shopify-style: a variant may override the product) ──

export const variantPrice = (p: StoreProduct, v?: StoreVariant) => v?.price ?? p.price;
export const variantCompareAt = (p: StoreProduct, v?: StoreVariant) =>
  v?.price != null ? v.compareAtPrice : (v?.compareAtPrice ?? p.compareAtPrice);
export const variantImage = (p: StoreProduct, v?: StoreVariant) => v?.image ?? p.images[0];

/** Lowest and highest price across variants (for "from Rp…" on cards, sorting and filtering). */
export function priceRange(p: StoreProduct): { min: number; max: number } {
  const prices = p.variants.length ? p.variants.map((v) => variantPrice(p, v)) : [p.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
