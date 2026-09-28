import Link from "next/link";
import Image from "next/image";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { LookCard } from "@/components/storefront/look-card";
import {
  getSiteSettings,
  listAnnotationsForImages,
  listCategories,
  listFeaturedImages,
  listHotspotsForImages,
  listPublishedImagesExcluding,
} from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";

// Content is managed from /admin and must reflect edits immediately —
// without this, Next statically prerenders the page at build time and
// visitors see stale data until the next deploy.
export const dynamic = "force-dynamic";

const HOME_GRID_SIZE = 8;

export default async function HomePage() {
  const [t, settings, categories, featured] = await Promise.all([
    getDictionary(),
    getSiteSettings(),
    listCategories(),
    listFeaturedImages(),
  ]);

  // The grid skips whatever is already in the carousel, so no look shows twice.
  // One extra is fetched just to know whether a "See all" link is needed.
  const rest = await listPublishedImagesExcluding(
    featured.map((i) => i._id),
    HOME_GRID_SIZE + 1
  );
  const latest = rest.slice(0, HOME_GRID_SIZE);
  const ids = latest.map((i) => i._id);
  const [hotspots, annotations] = await Promise.all([listHotspotsForImages(ids), listAnnotationsForImages(ids)]);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8">
        <section className="mb-14 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 font-display text-3xl text-orange">{t.home.eyebrow}</p>
            <h1 className="max-w-md text-3xl font-semibold leading-tight text-brown md:text-5xl">{t.home.headline}</h1>
            <p className="mt-4 max-w-sm text-brown-soft">{t.home.sub}</p>

            {(settings.creatorName || settings.avatarUrl) && (
              <div className="mt-8 flex items-center gap-3">
                {settings.avatarUrl && (
                  <Image
                    src={settings.avatarUrl}
                    alt={settings.creatorName}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <div>
                  {settings.creatorName && <p className="font-semibold text-brown">{settings.creatorName}</p>}
                  {settings.tagline && <p className="text-sm text-brown-soft">{settings.tagline}</p>}
                </div>
              </div>
            )}
          </div>

          {featured.length > 0 && (
            <div className="mx-auto w-full max-w-md md:ml-auto md:mr-0">
              <HeroCarousel images={featured} />
            </div>
          )}
        </section>

        {latest.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brown">{t.home.yourLooks}</h2>
              {rest.length > HOME_GRID_SIZE && (
                <Link href="/shop" className="text-sm font-medium text-orange hover:underline">
                  {t.home.seeAll}
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {latest.map((image) => (
                <LookCard
                  key={image._id}
                  image={image}
                  hotspots={hotspots}
                  annotations={annotations}
                  categories={categories}
                  t={t}
                />
              ))}
            </div>
          </section>
        ) : (
          featured.length === 0 && <p className="text-brown-soft">{t.home.empty}</p>
        )}
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
