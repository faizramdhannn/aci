import Image from "next/image";
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
      {settings.heroImage ? (
        <section className="relative mb-12 overflow-hidden rounded-3xl bg-brown/10">
          <div className="relative aspect-[4/5] sm:aspect-[16/9]">
            <Image
              src={settings.heroImage}
              alt={settings.heroTitle || settings.storeName}
              fill
              priority
              sizes="(min-width: 1152px) 1104px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
                {settings.heroTitle || settings.storeName}
              </h1>
              {(settings.heroSubtitle || settings.tagline) && (
                <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{settings.heroSubtitle || settings.tagline}</p>
              )}
              {products.length > 0 && (
                <a
                  href="#products"
                  className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
                >
                  {t.store.heroCta}
                </a>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-brown sm:text-5xl">{settings.heroTitle || settings.storeName}</h1>
          {(settings.heroSubtitle || settings.tagline) && (
            <p className="mx-auto mt-3 max-w-md text-brown-soft">{settings.heroSubtitle || settings.tagline}</p>
          )}
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
