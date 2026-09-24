import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import type { Metadata } from "next";
import { LookCard } from "@/components/storefront/look-card";
import { Pagination } from "@/components/ui/pagination";
import { listAnnotationsForImages, listCategories, listHotspotsForImages, listPublishedImagesPage } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).shop.title };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const [t, categories, { items: images, page, totalPages }] = await Promise.all([
    getDictionary(),
    listCategories(),
    listPublishedImagesPage({ page: requestedPage, pageSize: PAGE_SIZE }),
  ]);
  const ids = images.map((i) => i._id);
  const [hotspots, annotations] = await Promise.all([listHotspotsForImages(ids), listAnnotationsForImages(ids)]);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8">
        <h1 className="mb-6 text-2xl font-semibold text-brown">{t.shop.title}</h1>
        {images.length === 0 ? (
          <p className="text-brown-soft">{t.shop.empty}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {images.map((image) => (
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
            <Pagination page={page} totalPages={totalPages} basePath="/shop" t={t} />
          </>
        )}
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
