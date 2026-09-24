import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { ShoppableImage } from "@/components/storefront/shoppable-image";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { getShoppableImageBySlug, listHotspotsForImage, listAnnotationsForImage } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const image = await getShoppableImageBySlug(slug);
  if (!image) return {};
  const description = image.description ?? "Tap an item in the photo to see where it's from.";
  return {
    title: image.title,
    description,
    openGraph: {
      title: image.title,
      description,
      images: [{ url: image.imageUrl, width: image.imageWidth, height: image.imageHeight, alt: image.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: image.title,
      description,
      images: [image.imageUrl],
    },
  };
}

export default async function ShoppableImagePage({ params }: { params: Params }) {
  const { slug } = await params;
  const image = await getShoppableImageBySlug(slug);
  if (!image) notFound();

  const [hotspots, annotations] = await Promise.all([
    listHotspotsForImage(image._id),
    listAnnotationsForImage(image._id),
  ]);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <div className="relative">
          <ShoppableImage image={image} hotspots={hotspots} annotations={annotations} />
          <FavoriteButton imageId={image._id} className="absolute right-3 top-3" />
        </div>
        <div className="mt-6">
          <h1 className="text-xl font-semibold text-brown">{image.title}</h1>
          {image.description && <p className="mt-1 text-brown-soft">{image.description}</p>}
        </div>
      </main>
      <BottomBar />
    </>
  );
}
