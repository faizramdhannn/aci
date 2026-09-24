import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { LookCard } from "@/components/storefront/look-card";
import { listAnnotationsForImages, listCategories, listHotspotsForImages, searchContent } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";

type SearchParams = Promise<{ q?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const [{ q }, t] = await Promise.all([searchParams, getDictionary()]);
  return { title: q?.trim() ? format(t.search.resultsFor, { q: q.trim() }) : t.search.title };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ q }, t, categories] = await Promise.all([searchParams, getDictionary(), listCategories()]);
  const query = q?.trim() ?? "";
  const images = query ? (await searchContent(query)).images : null;
  const ids = images?.map((i) => i._id) ?? [];
  const [hotspots, annotations] = await Promise.all([listHotspotsForImages(ids), listAnnotationsForImages(ids)]);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pt-8">
        <form action="/search" method="get" className="mb-8">
          <input
            type="text"
            name="q"
            defaultValue={query}
            autoFocus
            aria-label={t.search.title}
            placeholder={t.search.placeholder}
            className="w-full rounded-full border border-brown/20 bg-surface/80 px-5 py-3 text-lg outline-none focus:border-orange"
          />
        </form>

        {!query && <p className="text-brown-soft">{t.search.prompt}</p>}

        {images && images.length === 0 && (
          <p className="text-brown-soft">{format(t.search.noMatch, { q: query })}</p>
        )}

        {images && images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
        )}
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
