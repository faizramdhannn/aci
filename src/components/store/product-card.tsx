"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { StoreProduct } from "@/types/store";
import type { StoreDictionary } from "@/lib/i18n/store-dictionaries";
import { formatRupiah } from "@/lib/store/money";
import { priceRange } from "@/lib/store/catalog";
import { WishlistButton } from "@/components/store/wishlist-button";
import { Stars } from "@/components/store/stars";
import type { RatingSummary } from "@/lib/store/reviews";

const MAX_SWATCHES = 5;

export function ProductCard({
  product,
  t,
  priority,
  rating,
}: {
  product: StoreProduct;
  t: StoreDictionary;
  priority?: boolean;
  rating?: RatingSummary;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const soldOut = product.variants.every((v) => v.stock === 0);
  const range = priceRange(product);
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > range.min);
  const cover = preview ?? product.images[0] ?? product.variants.find((v) => v.image)?.image;
  const href = `/narras/p/${product.slug}`;
  // Photo swatches when variants have their own photos; otherwise just their names.
  const swatches = product.variants.length > 1 && product.variants.some((v) => v.image) ? product.variants : [];
  const variantNames = product.variants.length > 1 && swatches.length === 0 ? product.variants.map((v) => v.name).join(" · ") : "";
  return (
    <Link href={href} className="group block" onMouseLeave={() => setPreview(null)}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-brown/5">
        {cover && (
          <Image
            src={cover}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${soldOut ? "opacity-60" : ""}`}
            priority={priority}
          />
        )}
        <span className="absolute right-2 top-2">
          <WishlistButton productId={product._id} overlay />
        </span>
        {(soldOut || onSale) && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              soldOut ? "bg-brown text-cream" : "bg-orange text-cream"
            }`}
          >
            {soldOut ? t.store.soldOut : t.store.sale}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium text-brown">{product.title}</h3>
      <p className="mt-0.5 text-sm">
        <span className="font-semibold text-brown">
          {range.min === range.max ? formatRupiah(range.min) : `${t.store.from} ${formatRupiah(range.min)}`}
        </span>
        {onSale && <span className="ml-2 text-brown-soft line-through">{formatRupiah(product.compareAtPrice!)}</span>}
      </p>
      {rating && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-brown-soft">
          <Stars value={rating.average} size={12} />
          <span>
            {rating.average.toFixed(1)} ({rating.count})
          </span>
        </p>
      )}
      {variantNames && <p className="mt-0.5 text-xs text-brown-soft">{variantNames}</p>}
      {swatches.length > 0 && (
        // Other colours/motifs: hover to preview on the card, click to open the product with it picked.
        <div className="mt-2 flex items-center gap-1.5">
          {swatches.slice(0, MAX_SWATCHES).map((v) => (
            <button
              key={v.id}
              type="button"
              title={v.name}
              aria-label={v.name}
              onMouseEnter={() => v.image && setPreview(v.image)}
              onFocus={() => v.image && setPreview(v.image)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`${href}?v=${encodeURIComponent(v.id)}`);
              }}
              className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-md border transition ${
                preview && preview === v.image ? "border-brown ring-1 ring-brown" : "border-brown/15 hover:border-brown/50"
              } ${v.stock === 0 ? "opacity-40" : ""}`}
            >
              {v.image ? (
                <Image src={v.image} alt="" fill sizes="28px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-brown/5 text-[10px] font-semibold text-brown">
                  {v.name.slice(0, 2)}
                </span>
              )}
            </button>
          ))}
          {swatches.length > MAX_SWATCHES && <span className="text-xs text-brown-soft">+{swatches.length - MAX_SWATCHES}</span>}
        </div>
      )}
    </Link>
  );
}
