import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { listShoppableImages } from "@/lib/data";

export default async function ShopPage() {
  const images = (await listShoppableImages()).filter((i) => i.status === "published");

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
        )}
      </main>
      <BottomBar />
    </>
  );
}
