import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import type { Metadata } from "next";
import { LookPreview } from "@/components/storefront/look-preview";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { Pagination } from "@/components/ui/pagination";
import { listAllHotspots, listAnnotationsForImage, listShoppableImages } from "@/lib/data";
import { paginate } from "@/lib/pagination";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const allImages = (await listShoppableImages()).filter((i) => i.status === "published");
  const { items: images, page, totalPages } = paginate(allImages, requestedPage, PAGE_SIZE);

  // Only fetch hotspots/annotations for the images actually shown on this
  // page, not the whole catalog — the previous version fetched annotations
  // for every published look on every visit, which gets heavy fast once
  // there are more than a couple dozen.
  const pageImageIds = new Set(images.map((i) => i._id));
  const hotspotsForPage = (await listAllHotspots()).filter((h) => pageImageIds.has(h.shoppableImageId));
  const annotationsByImage = Object.fromEntries(
    await Promise.all(images.map(async (image) => [image._id, await listAnnotationsForImage(image._id)] as const))
  );

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <h1 className="mb-6 text-2xl font-semibold text-brown">Shop</h1>
        {images.length === 0 ? (
          <p className="text-brown-soft">Nothing here yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {images.map((image) => (
                <div key={image._id} className="group relative">
                  <Link href={`/p/${image.slug}`} className="block">
                    <LookPreview
                      image={image}
                      hotspots={hotspotsForPage.filter((h) => h.shoppableImageId === image._id)}
                      annotations={annotationsByImage[image._id]}
                    />
                    <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
                  </Link>
                  <FavoriteButton imageId={image._id} className="absolute right-2 top-2" />
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} basePath="/shop" />
          </>
        )}
      </main>
      <BottomBar />
    </>
  );
}
