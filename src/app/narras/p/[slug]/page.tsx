import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCart } from "@/components/store/add-to-cart";
import { getStoreProductBySlug, getStoreSettings } from "@/lib/store/data";
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

  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-6 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-10">
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
      </div>
    </main>
  );
}
