import { HeroSlider } from "@/components/store/hero-slider";
import type { Metadata } from "next";
import { ProductCard } from "@/components/store/product-card";
import { Suspense } from "react";
import { getStoreSettings, listStoreProducts } from "@/lib/store/data";
import { listCollections } from "@/lib/store/collections";
import { colourOptions, filterProducts, SORTS, type ProductSort } from "@/lib/store/catalog";
import { StoreFilters } from "@/components/store/store-filters";
import { listReviews, ratingsByProduct } from "@/lib/store/reviews";
import { format } from "@/lib/i18n/dictionaries";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return { title: { absolute: settings.storeName }, description: settings.tagline };
}

type Params = { q?: string; collection?: string; colour?: string; sort?: string; stock?: string };

export default async function StorePage({ searchParams }: { searchParams: Promise<Params> }) {
  const [params, t, settings, all, collections, reviews] = await Promise.all([
    searchParams,
    getStoreDictionary(),
    getStoreSettings(),
    listStoreProducts({ activeOnly: true }),
    listCollections(),
    listReviews({ status: "active" }),
  ]);
  const ratings = ratingsByProduct(reviews);
  const collection = collections.find((c) => c.slug === params.collection);
  // Only collections that have something in them.
  const usedCollections = collections.filter((c) => all.some((p) => (p.collectionIds ?? []).includes(c._id)));
  const products = filterProducts(all, {
    q: params.q,
    collectionId: collection?._id,
    colour: params.colour,
    inStockOnly: params.stock === "1",
    sort: SORTS.includes(params.sort as ProductSort) ? (params.sort as ProductSort) : "newest",
  });
  const filtering = Boolean(params.q || collection || params.colour || params.stock);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      {settings.heroBanners && settings.heroBanners.length > 0 ? (
        <HeroSlider
          banners={settings.heroBanners}
          fallbackTitle={settings.storeName}
          fallbackSubtitle={settings.tagline}
          cta={t.store.heroCta}
        />
      ) : (
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-brown sm:text-5xl">{settings.storeName}</h1>
          {settings.tagline && <p className="mx-auto mt-3 max-w-md text-brown-soft">{settings.tagline}</p>}
        </section>
      )}

      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="products" className="scroll-mt-24 text-sm font-semibold uppercase tracking-wider text-brown-soft">
          {collection?.name ?? t.store.allProducts}
        </h2>
        {filtering && <span className="text-xs text-brown-soft">{format(t.store.resultCount, { n: products.length })}</span>}
      </div>
      {all.length > 0 && (
        <Suspense>
          <StoreFilters collections={usedCollections} colours={colourOptions(all)} />
        </Suspense>
      )}
      {all.length === 0 ? (
        <p className="py-16 text-center text-brown-soft">{t.store.empty}</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-brown-soft">{t.store.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} t={t} priority={i < 4} rating={ratings[product._id]} />
          ))}
        </div>
      )}
    </main>
  );
}
