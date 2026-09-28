import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { HUB_NAME } from "@/config/site";
import { getSiteSettings, listFeaturedImages, listPublishedImagesExcluding } from "@/lib/data";
import { getStoreSettings, listStoreProducts } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { absolute: HUB_NAME } };

/** Landing page after the splash: pick the outfit site or the hijab store. */
export default async function HubPage() {
  const [t, site, store, featured, latest, products] = await Promise.all([
    getStoreDictionary(),
    getSiteSettings(),
    getStoreSettings(),
    listFeaturedImages(),
    listPublishedImagesExcluding([], 1),
    listStoreProducts({ activeOnly: true }),
  ]);

  const outfitCover = featured[0]?.imageUrl ?? latest[0]?.imageUrl;
  const storeCover = products.find((p) => p.images[0])?.images[0];

  const cards = [
    {
      href: "/outfit",
      title: t.hub.outfitTitle,
      body: site.tagline || t.hub.outfitBody,
      cover: outfitCover,
      tone: "bg-yellow/30",
    },
    {
      href: "/narras",
      title: store.storeName || t.hub.storeTitle,
      body: store.tagline || t.hub.storeBody,
      cover: storeCover,
      tone: "bg-orange/15",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6">
      <div className="flex items-center justify-end gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <header className="mb-8 mt-4 text-center sm:mb-12">
        <p className="text-6xl text-orange sm:text-7xl" style={{ fontFamily: "Lazydog, var(--font-playfair), Georgia, serif" }}>
          {HUB_NAME}
        </p>
        <h1 className="mt-3 text-sm font-medium text-brown-soft">{t.hub.title}</h1>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group overflow-hidden rounded-3xl border border-brown/10 bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`relative aspect-[4/3] overflow-hidden ${card.tone}`}>
              {card.cover && (
                <Image
                  src={card.cover}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 480px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  priority
                />
              )}
            </div>
            <div className="flex items-end justify-between gap-4 p-5">
              <div>
                <h2 className="text-xl font-semibold text-brown">{card.title}</h2>
                <p className="mt-1 text-sm text-brown-soft">{card.body}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-orange">{t.hub.enter}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
