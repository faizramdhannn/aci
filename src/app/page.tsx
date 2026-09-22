import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { listShoppableImages } from "@/lib/data";

// Content is managed from /admin and must reflect edits immediately —
// without this, Next statically prerenders the page at build time and
// visitors see stale data until the next deploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const images = await listShoppableImages();
  const published = images.filter((i) => i.status === "published");

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

        {published.length > 0 && (
          <section className="mb-12 mt-6 max-w-md">
            <HeroCarousel images={published} />
          </section>
        )}

        {published.length > 0 ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-brown">Your looks</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {published.map((image) => (
                <Link key={image._id} href={`/p/${image.slug}`} className="group block">
                  <div
                    className="relative overflow-hidden rounded-xl"
                    style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
                </Link>
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
