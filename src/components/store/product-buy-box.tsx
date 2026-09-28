"use client";

import { useState } from "react";
import type { StoreProduct } from "@/types/store";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCart } from "@/components/store/add-to-cart";
import { formatRupiah } from "@/lib/store/money";
import { priceRange, variantCompareAt, variantImage, variantPrice } from "@/lib/store/catalog";

/**
 * Gallery + price + variant picker for a product page. Picking a variant
 * shows its own photo and price when it has them (Shopify-style variants).
 */
export function ProductBuyBox({
  product,
  initialVariant,
  children,
}: {
  product: StoreProduct;
  /** From ?v= (a swatch clicked on a product card). */
  initialVariant?: string;
  children?: React.ReactNode;
}) {
  const [variantId, setVariantId] = useState<string | null>(
    () =>
      product.variants.find((v) => v.id === initialVariant)?.id ??
      product.variants.find((v) => v.stock > 0)?.id ??
      product.variants[0]?.id ??
      null
  );
  const variant = product.variants.find((v) => v.id === variantId);
  const price = variantPrice(product, variant);
  const compareAt = variantCompareAt(product, variant);
  const range = priceRange(product);
  const image = variant?.image ?? variantImage(product);
  // Photos: the product's, plus any variant photo that isn't among them.
  const images = [...new Set([...product.images, ...product.variants.flatMap((v) => (v.image ? [v.image] : []))])];

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <ProductGallery key={variant?.image ?? "product"} images={images} title={product.title} initial={image} />
      <div className="md:pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-brown sm:text-3xl">{product.title}</h1>
        <p className="mt-3 text-xl">
          <span className="font-semibold text-brown">
            {variant || range.min === range.max ? formatRupiah(price) : `${formatRupiah(range.min)} – ${formatRupiah(range.max)}`}
          </span>
          {compareAt && compareAt > price && (
            <span className="ml-3 text-base text-brown-soft line-through">{formatRupiah(compareAt)}</span>
          )}
        </p>
        <div className="mt-8">
          <AddToCart
            productId={product._id}
            variants={product.variants}
            optionName={product.optionName}
            variantId={variantId}
            onVariantChange={setVariantId}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
