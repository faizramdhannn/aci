import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import type { Metadata } from "next";
import { CategoryIcon } from "@/components/admin/category-icons";
import { LookPreview } from "@/components/storefront/look-preview";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { listAllHotspots, listAnnotationsForImage, listCategories, listShoppableImages } from "@/lib/data";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: activeCategoryId } = await searchParams;
  const [categories, allImages, allHotspots] = await Promise.all([
    listCategories(),
    listShoppableImages(),
    listAllHotspots(),
  ]);
  const images = allImages.filter((i) => i.status === "published");

  const activeCategory = activeCategoryId
    ? categories.find((c) => c._id === activeCategoryId)
    : undefined;

  // A look matches a category either directly (set on upload) or through any
  // of its own products (hotspots) being tagged with that category.
  const visibleImages = activeCategory
    ? images.filter((i) => {
        if (i.categoryIds.includes(activeCategory._id)) return true;
        return allHotspots.some(
          (h) => h.shoppableImageId === i._id && (h.categoryIds ?? []).includes(activeCategory._id)
        );
      })
    : images;

  const annotationsByImage = Object.fromEntries(
    await Promise.all(
      visibleImages.map(async (image) => [image._id, await listAnnotationsForImage(image._id)] as const)
    )
  );

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <h1 className="mb-6 text-2xl font-semibold text-brown">Categories</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/categories"
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              !activeCategory
                ? "border-orange bg-orange text-cream"
                : "border-brown/15 bg-surface/70 text-brown hover:border-orange/50"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/categories?category=${category._id}`}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                activeCategory?._id === category._id
                  ? "border-orange bg-orange text-cream"
                  : "border-brown/15 bg-surface/70 text-brown hover:border-orange/50"
              }`}
            >
              <CategoryIcon
                name={category.icon}
                className={`h-4 w-4 ${activeCategory?._id === category._id ? "text-cream" : "text-orange"}`}
              />
              {category.name}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {visibleImages.length === 0 ? (
            <p className="text-brown-soft">Nothing here yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {visibleImages.map((image) => (
                <div key={image._id} className="group relative">
                  <Link href={`/p/${image.slug}`} className="block">
                    <LookPreview
                      image={image}
                      hotspots={allHotspots.filter((h) => h.shoppableImageId === image._id)}
                      annotations={annotationsByImage[image._id]}
                    />
                    <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
                  </Link>
                  <FavoriteButton imageId={image._id} className="absolute right-2 top-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomBar />
    </>
  );
}
