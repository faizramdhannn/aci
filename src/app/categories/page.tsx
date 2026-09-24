import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import type { Metadata } from "next";
import { CategoryIcon } from "@/components/admin/category-icons";
import { LookCard } from "@/components/storefront/look-card";
import { Pagination } from "@/components/ui/pagination";
import { listAnnotationsForImages, listCategories, listHotspotsForImages, listPublishedImagesPage } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).categories.title };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const chipClass = (active: boolean) =>
  `flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
    active ? "border-orange bg-orange text-cream" : "border-brown/15 bg-surface/70 text-brown hover:border-orange/50"
  }`;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category: activeCategoryId, page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const [t, allCategories] = await Promise.all([getDictionary(), listCategories()]);
  const categories = allCategories.filter((c) => c.isActive);
  const activeCategory = activeCategoryId ? categories.find((c) => c._id === activeCategoryId) : undefined;

  const { items: images, page, totalPages } = await listPublishedImagesPage({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    categoryId: activeCategory?._id,
  });
  const ids = images.map((i) => i._id);
  const [hotspots, annotations] = await Promise.all([listHotspotsForImages(ids), listAnnotationsForImages(ids)]);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8">
        <h1 className="mb-6 text-2xl font-semibold text-brown">{t.categories.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/categories" className={chipClass(!activeCategory)}>
            {t.categories.all}
          </Link>
          {categories.map((category) => {
            const active = activeCategory?._id === category._id;
            return (
              <Link key={category._id} href={`/categories?category=${category._id}`} className={chipClass(active)}>
                <CategoryIcon name={category.icon} className={`h-4 w-4 ${active ? "text-cream" : "text-orange"}`} />
                {category.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          {images.length === 0 ? (
            <p className="text-brown-soft">{t.categories.empty}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {images.map((image) => (
                  <LookCard
                    key={image._id}
                    image={image}
                    hotspots={hotspots}
                    annotations={annotations}
                    categories={allCategories}
                    t={t}
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath="/categories"
                searchParams={{ category: activeCategoryId }}
                t={t}
              />
            </>
          )}
        </div>
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
