"use client";

import { useSearchParams } from "next/navigation";
import type { StoreCollection, StoreProduct } from "@/types/store";
import type { RatingSummary } from "@/lib/store/reviews";
import { ProductCard } from "@/components/store/product-card";
import { StoreFilters } from "@/components/store/store-filters";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { colourOptions, filterProducts, SORTS, type ProductSort } from "@/lib/store/catalog";
import { format } from "@/lib/i18n/dictionaries";

/**
 * Product grid with search/filters, applied in the browser: the page is
 * cached once for everyone and the (small) catalog is filtered locally.
 * Rendered inside <Suspense> with an unfiltered grid as the fallback, which
 * is also what search engines see.
 */
export function StoreCatalog({
  products: all,
  collections,
  ratings,
}: {
  products: StoreProduct[];
  collections: StoreCollection[];
  ratings: Record<string, RatingSummary>;
}) {
  const t = useStoreDictionary();
  const params = useSearchParams();
  const collection = collections.find((c) => c.slug === params.get("collection"));
  const sort = params.get("sort");
  const products = filterProducts(all, {
    q: params.get("q") ?? undefined,
    collectionId: collection?._id,
    colour: params.get("colour") ?? undefined,
    inStockOnly: params.get("stock") === "1",
    sort: SORTS.includes(sort as ProductSort) ? (sort as ProductSort) : "newest",
  });
  const filtering = Boolean(params.get("q") || collection || params.get("colour") || params.get("stock"));

  return (
    <>
      <CatalogHeading title={collection?.name ?? t.store.allProducts} count={filtering ? format(t.store.resultCount, { n: products.length }) : null} />
      {all.length > 0 && <StoreFilters collections={collections} colours={colourOptions(all)} />}
      <CatalogGrid products={products} ratings={ratings} emptyText={all.length === 0 ? t.store.empty : t.store.noResults} />
    </>
  );
}

export function CatalogHeading({ title, count }: { title: string; count: string | null }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 id="products" className="scroll-mt-24 text-sm font-semibold uppercase tracking-wider text-brown-soft">
        {title}
      </h2>
      {count && <span className="text-xs text-brown-soft">{count}</span>}
    </div>
  );
}

export function CatalogGrid({
  products,
  ratings,
  emptyText,
}: {
  products: StoreProduct[];
  ratings: Record<string, RatingSummary>;
  emptyText: string;
}) {
  const t = useStoreDictionary();
  if (products.length === 0) return <p className="py-16 text-center text-brown-soft">{emptyText}</p>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product._id} product={product} t={t} priority={i < 4} rating={ratings[product._id]} />
      ))}
    </div>
  );
}
