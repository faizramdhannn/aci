import { HeroSlider } from "@/components/store/hero-slider";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getStoreSettings, listStoreProducts } from "@/lib/store/data";
import { listCollections } from "@/lib/store/collections";
import { listReviews, ratingsByProduct } from "@/lib/store/reviews";
import { CatalogGrid, CatalogHeading, StoreCatalog } from "@/components/store/store-catalog";
import { getStoreDictionary } from "@/lib/i18n/server";

// Cached; refreshed whenever content changes (src/lib/revalidate.ts), at least hourly.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return { title: { absolute: settings.storeName }, description: settings.tagline };
}

export default async function StorePage() {
  const [t, settings, all, collections, reviews] = await Promise.all([
    getStoreDictionary(),
    getStoreSettings(),
    listStoreProducts({ activeOnly: true }),
    listCollections(),
    listReviews({ status: "active" }),
  ]);
  const ratings = ratingsByProduct(reviews);
  // Only collections that have something in them.
  const usedCollections = collections.filter((c) => all.some((p) => (p.collectionIds ?? []).includes(c._id)));

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

      <Suspense
        fallback={
          <>
            <CatalogHeading title={t.store.allProducts} count={null} />
            <CatalogGrid products={all} ratings={ratings} emptyText={t.store.empty} />
          </>
        }
      >
        <StoreCatalog products={all} collections={usedCollections} ratings={ratings} />
      </Suspense>
    </main>
  );
}
