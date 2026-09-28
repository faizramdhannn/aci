import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCart } from "@/components/store/add-to-cart";
import { CommentsSection } from "@/components/comments/comments-section";
import { ReviewsSection } from "@/components/store/reviews-section";
import { getStoreProductBySlug, getStoreSettings, listStoreProducts } from "@/lib/store/data";
import { relatedProducts } from "@/lib/store/catalog";
import { ProductCard } from "@/components/store/product-card";
import { ShareButtons } from "@/components/store/share-buttons";
import { listReviews, ratingsByProduct } from "@/lib/store/reviews";
import { formatRupiah } from "@/lib/store/money";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, settings] = await Promise.all([params, getStoreSettings()]);
  const product = await getStoreProductBySlug(slug);
  if (!product || product.status !== "active") return {};
  return {
    title: { absolute: `${product.title} — ${settings.storeName}` },
    description: product.description.slice(0, 160),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, t] = await Promise.all([getStoreProductBySlug(slug), getStoreDictionary()]);
  if (!product || product.status !== "active") notFound();
  const [all, reviews] = await Promise.all([listStoreProducts({ activeOnly: true }), listReviews({ status: "active" })]);
  const related = relatedProducts(product, all);
  const ratings = ratingsByProduct(reviews);

  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 md:pt-10">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} title={product.title} />
        <div className="md:pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-brown sm:text-3xl">{product.title}</h1>
          <p className="mt-3 text-xl">
            <span className="font-semibold text-brown">{formatRupiah(product.price)}</span>
            {onSale && (
              <span className="ml-3 text-base text-brown-soft line-through">{formatRupiah(product.compareAtPrice!)}</span>
            )}
          </p>
          <div className="mt-8">
            <AddToCart productId={product._id} variants={product.variants} />
          </div>
          {product.description && (
            <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-brown-soft">{product.description}</p>
          )}
          <p className="mt-6 text-xs text-brown-soft">{t.store.shippingNote}</p>
          <div className="mt-6">
            <ShareButtons title={product.title} />
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-4 text-lg font-semibold text-brown">
            {t.store.related}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} t={t} rating={ratings[p._id]} />
            ))}
          </div>
        </section>
      )}
      <div className="max-w-2xl">
        <ReviewsSection productId={product._id} />
        <CommentsSection target="product" targetId={product._id} />
      </div>
    </main>
  );
}
