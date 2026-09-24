import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { ShoppableImage } from "@/components/storefront/shoppable-image";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { TapHint } from "@/components/storefront/tap-hint";
import { getShoppableImageBySlug, listHotspotsForImage, listAnnotationsForImage } from "@/lib/data";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";
import { storeNameFor } from "@/lib/store-name";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const image = await getShoppableImageBySlug(slug);
  if (!image || image.status !== "published") return {};
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
  if (!image || image.status !== "published") notFound();

  const [hotspots, annotations, t, locale] = await Promise.all([
    listHotspotsForImage(image._id),
    listAnnotationsForImage(image._id),
    getDictionary(),
    getLocale(),
  ]);
  const items = hotspots.filter((h) => h.isActive);
  const price = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-8">
        <div className="relative">
          <ShoppableImage image={image} hotspots={hotspots} annotations={annotations} />
          <FavoriteButton imageId={image._id} className="absolute right-3 top-3" />
          {items.length > 0 && <TapHint />}
        </div>

        <div className="mt-6">
          <h1 className="text-xl font-semibold text-brown">{image.title}</h1>
          {image.description && <p className="mt-1 text-brown-soft">{image.description}</p>}
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-soft">{t.look.itemsInLook}</h2>
          {items.length === 0 ? (
            <p className="text-sm text-brown-soft">{t.look.noItems}</p>
          ) : (
            <ul className="divide-y divide-brown/10 rounded-2xl border border-brown/10 bg-surface/70">
              {items.map((item) => {
                const store = storeNameFor(item);
                return (
                  <li key={item._id} className="flex items-center gap-3 p-3">
                    {item.productImageUrl ? (
                      <Image
                        src={item.productImageUrl}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brown">{item.title}</p>
                      <p className="text-xs text-brown-soft">
                        {[item.productPrice ? price.format(item.productPrice) : null, store].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <a
                      href={`/go/${item._id}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="shrink-0 rounded-full bg-orange px-4 py-2 text-xs font-semibold text-cream transition-opacity hover:opacity-90"
                    >
                      {store ? format(t.look.shopOn, { store }) : t.look.shop}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          {items.length > 0 && <p className="mt-3 text-xs text-brown-soft">{t.look.affiliateNote}</p>}
        </section>
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
