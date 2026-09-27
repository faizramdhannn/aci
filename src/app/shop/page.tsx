import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import type { Metadata } from "next";
import { CategoryCropCard } from "@/components/storefront/category-crop-card";
import { Pagination } from "@/components/ui/pagination";
import { listShopEntries } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).shop.title };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 16;

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const [t, { items: entries, page, totalPages }] = await Promise.all([
    getDictionary(),
    listShopEntries({ page: requestedPage, pageSize: PAGE_SIZE }),
  ]);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8">
        <h1 className="mb-6 text-2xl font-semibold text-brown">{t.shop.title}</h1>
        {entries.length === 0 ? (
          <p className="text-brown-soft">{t.shop.empty}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {entries.map((entry) => (
                <CategoryCropCard key={`${entry.image._id}:${entry.category._id}`} entry={entry} t={t} />
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
