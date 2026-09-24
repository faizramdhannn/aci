import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { LookPreview } from "@/components/storefront/look-preview";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { listAllHotspots, listAnnotationsForImage, listShoppableImages } from "@/lib/data";

// Content is managed from /admin and must reflect edits immediately —
// without this, Next statically prerenders the page at build time and
// visitors see stale data until the next deploy.
export const dynamic = "force-dynamic";

// The homepage is an editorial preview, not the full catalog — capped so it
// stays fast regardless of how many looks exist. Everything else lives on
// the paginated /shop page.
const HOME_GRID_SIZE = 8;

export default async function HomePage() {
  const images = await listShoppableImages();
  const allPublished = images.filter((i) => i.status === "published");
  const featured = allPublished.slice(0, HOME_GRID_SIZE);

  const featuredIds = new Set(featured.map((i) => i._id));
  const hotspotsForFeatured = (await listAllHotspots()).filter((h) => featuredIds.has(h.shoppableImageId));
  const annotationsByImage = Object.fromEntries(
    await Promise.all(
      featured.map(async (image) => [image._id, await listAnnotationsForImage(image._id)] as const)
    )
  );

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <section className="mb-4">
          <p className="mb-3 font-display text-3xl text-orange">Your looks, shoppable.</p>
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-brown md:text-4xl">
            Tap an item in the photo to see where it&rsquo;s from.
          </h1>
          <p className="mt-4 max-w-sm text-brown-soft">
            One photo, every piece linked. No account needed to shop the look.
          </p>
        </section>

        {featured.length > 0 && (
          <section className="mb-12 mt-6 max-w-md">
            <HeroCarousel images={featured} />
          </section>
        )}

        {featured.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brown">Your looks</h2>
              {allPublished.length > HOME_GRID_SIZE && (
                <Link href="/shop" className="text-sm font-medium text-orange hover:underline">
                  See all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {featured.map((image) => (
                <div key={image._id} className="group relative">
                  <Link href={`/p/${image.slug}`} className="block">
                    <LookPreview
                      image={image}
                      hotspots={hotspotsForFeatured.filter((h) => h.shoppableImageId === image._id)}
                      annotations={annotationsByImage[image._id]}
                    />
                    <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
                  </Link>
                  <FavoriteButton imageId={image._id} className="absolute right-2 top-2" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-brown-soft">No shoppable images yet. Upload your first look to start adding product links.</p>
        )}
      </main>
      <BottomBar />
    </>
  );
}
