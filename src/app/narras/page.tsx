import { HeroSlider } from "@/components/store/hero-slider";
import type { Metadata } from "next";
import { ProductCard } from "@/components/store/product-card";
import { getStoreSettings, listStoreProducts } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return { title: { absolute: settings.storeName }, description: settings.tagline };
}

export default async function StorePage() {
  const [t, settings, products] = await Promise.all([
    getStoreDictionary(),
    getStoreSettings(),
    listStoreProducts({ activeOnly: true }),
  ]);

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

      <h2 id="products" className="scroll-mt-24 mb-4 text-sm font-semibold uppercase tracking-wider text-brown-soft">{t.store.allProducts}</h2>
      {products.length === 0 ? (
        <p className="py-16 text-center text-brown-soft">{t.store.empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} t={t} priority={i < 4} />
          ))}
        </div>
      )}
    </main>
  );
}
