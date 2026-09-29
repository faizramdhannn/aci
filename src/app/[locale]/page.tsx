import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { HUB_NAME } from "@/config/site";
import { getSiteSettings, listFeaturedImages, listPublishedImagesExcluding } from "@/lib/data";
import { getHubSettings, getStoreSettings, listStoreProducts } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

// Cached; refreshed whenever content changes (src/lib/revalidate.ts), at least hourly.
export const revalidate = 3600;

export const metadata: Metadata = { title: { absolute: HUB_NAME } };

/** Landing page after the splash: pick the outfit site or the hijab store. */
export default async function HubPage() {
  const [t, site, store, hub, featured, latest, products] = await Promise.all([
    getStoreDictionary(),
    getSiteSettings(),
    getStoreSettings(),
    getHubSettings(),
    listFeaturedImages(),
    listPublishedImagesExcluding([], 1),
    listStoreProducts({ activeOnly: true }),
  ]);

  const outfitCover = hub.outfitImage || (featured[0]?.imageUrl ?? latest[0]?.imageUrl);
  const storeCover = hub.storeImage || products.find((p) => p.images[0])?.images[0];

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
            aria-label={`${card.title} — ${t.hub.enter.replace(/\s*→\s*$/, "")}`}
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
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <h2 className="text-xl font-semibold text-brown">{card.title}</h2>
                <p className="mt-1 text-sm text-brown-soft">{card.body}</p>
              </div>
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-cream transition-transform duration-300 group-hover:translate-x-1"
              >
                <ArrowRight className="h-5 w-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
