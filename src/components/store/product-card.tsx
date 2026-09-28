import Link from "next/link";
import Image from "next/image";
import type { StoreProduct } from "@/types/store";
import type { StoreDictionary } from "@/lib/i18n/store-dictionaries";
import { formatRupiah } from "@/lib/store/money";
import { totalStock } from "@/lib/store/data";
import { WishlistButton } from "@/components/store/wishlist-button";

export function ProductCard({ product, t, priority }: { product: StoreProduct; t: StoreDictionary; priority?: boolean }) {
  const soldOut = totalStock(product) === 0;
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  return (
    <Link href={`/narras/p/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brown/5">
        {product.images[0] && (
          <Image
            src={product.images[0]}
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
        <span className="font-semibold text-brown">{formatRupiah(product.price)}</span>
        {onSale && <span className="ml-2 text-brown-soft line-through">{formatRupiah(product.compareAtPrice!)}</span>}
      </p>
      {product.variants.length > 1 && (
        <p className="mt-0.5 text-xs text-brown-soft">{product.variants.map((v) => v.name).join(" · ")}</p>
      )}
    </Link>
  );
}
