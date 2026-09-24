import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { searchContent } from "@/lib/data";

type SearchParams = Promise<{ q?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q?.trim() ? `Search: ${q.trim()}` : "Search" };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchContent(query) : null;

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <form action="/search" method="get" className="mb-8">
          <input
            type="text"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search looks and products…"
            className="w-full rounded-full border border-brown/20 bg-surface/80 px-5 py-3 text-lg outline-none focus:border-orange"
          />
        </form>

        {!query && <p className="text-brown-soft">Search for a look by name, or a product mentioned in one.</p>}

        {query && results && results.images.length === 0 && (
          <p className="text-brown-soft">Nothing matched &ldquo;{query}&rdquo;.</p>
        )}

        {results && results.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {results.images.map((image) => (
              <Link key={image._id} href={`/p/${image.slug}`} className="group block">
                <div
                  className="relative overflow-hidden rounded-xl"
                  style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
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
