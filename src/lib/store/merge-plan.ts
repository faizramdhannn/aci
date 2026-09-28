import type { StoreProduct, StoreVariant } from "@/types/store";

/** Pure planning for "merge products into one with variants" (Shopify-style). */

/** Longest shared leading words of all titles, without trailing separators: "Pashmina Ceruty Motif". */
export function commonTitle(titles: string[]): string {
  const split = titles.map((t) => t.trim().split(/\s+/));
  const first = split[0] ?? [];
  let n = 0;
  while (n < first.length && split.every((words) => words[n]?.toLowerCase() === first[n].toLowerCase())) n++;
  const shared = first.slice(0, n).join(" ");
  // "Pashmina Ceruty Motif - Flowers Art 1/2/3": the part after the last
  // separator names the variant, so stop the shared title before it.
  const titles0 = titles[0]?.trim() ?? "";
  const cut = Math.max(...[" - ", " – ", " — ", " | ", ": "].map((sep) => shared.lastIndexOf(sep)));
  const common = cut > 0 && titles0.length > shared.length ? shared.slice(0, cut) : shared;
  return common.replace(/[\s\-–—|:/,]+$/, "").trim();
}

/** What's left of a title after the shared part: "Flowers Art 1". */
export function titleSuffix(title: string, common: string): string {
  const rest = title.trim().slice(common.length).replace(/^[\s\-–—|:/,]+/, "").trim();
  return rest || title.trim();
}

export interface MergePlan {
  product: StoreProduct;
  /** old productId:variantId → new variantId (all now under product._id). */
  variantMap: Map<string, string>;
  removedIds: string[];
}

/**
 * Merges `products` into the first one. Each source becomes one variant per
 * original variant, named after the part of its title that differs (plus the
 * old variant name when a source had several). Photos are pooled; a variant
 * keeps its own photo and its own price when it differed.
 */
export function planMerge(products: StoreProduct[], title?: string): MergePlan {
  const [target] = products;
  const common = commonTitle(products.map((p) => p.title));
  const basePrice = target.price;
  const variantMap = new Map<string, string>();
  const variants: StoreVariant[] = [];
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();

  for (const source of products) {
    const suffix = titleSuffix(source.title, common);
    for (const v of source.variants) {
      let id = v.id;
      for (let n = 2; usedIds.has(id); n++) id = `${v.id}-${n}`;
      usedIds.add(id);

      let name = source.variants.length > 1 ? `${suffix} / ${v.name}` : products.length > 1 ? suffix : v.name;
      for (let n = 2; usedNames.has(name.toLowerCase()); n++) name = `${name} (${n})`;
      usedNames.add(name.toLowerCase());

      const price = v.price ?? source.price;
      const compareAt = v.compareAtPrice ?? (v.price == null ? source.compareAtPrice : undefined);
      variants.push({
        id,
        name: name.slice(0, 60),
        stock: v.stock,
        ...((v.image ?? source.images[0]) ? { image: v.image ?? source.images[0] } : {}),
        ...(price !== basePrice ? { price } : {}),
        ...(compareAt && compareAt !== target.compareAtPrice ? { compareAtPrice: compareAt } : {}),
        ...(v.sku ? { sku: v.sku } : {}),
      });
      variantMap.set(`${source._id}:${v.id}`, id);
    }
  }

  const product: StoreProduct = {
    ...target,
    title: (title?.trim() || common || target.title).slice(0, 120),
    description: target.description || products.find((p) => p.description)?.description || "",
    images: [...new Set(products.flatMap((p) => p.images))].slice(0, 30),
    variants,
    collectionIds: [...new Set(products.flatMap((p) => p.collectionIds ?? []))],
    status: products.some((p) => p.status === "active") ? "active" : "draft",
    optionName: target.optionName,
  };
  return { product, variantMap, removedIds: products.slice(1).map((p) => p._id) };
}
