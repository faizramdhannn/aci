import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import type { Metadata } from "next";
import { LookPreview } from "@/components/storefront/look-preview";
import { listAllHotspots, listAnnotationsForImage, listShoppableImages } from "@/lib/data";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const images = (await listShoppableImages()).filter((i) => i.status === "published");
  const allHotspots = await listAllHotspots();
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {images.map((image) => (
              <Link key={image._id} href={`/p/${image.slug}`} className="group block">
                <LookPreview
                  image={image}
                  hotspots={allHotspots.filter((h) => h.shoppableImageId === image._id)}
                  annotations={annotationsByImage[image._id]}
                />
                <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomBar />
    </>
  );
}
