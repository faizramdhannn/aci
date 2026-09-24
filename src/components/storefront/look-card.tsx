import Link from "next/link";
import type { Annotation, Category, Hotspot, ShoppableImage } from "@/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/dictionaries";
import { LookPreview } from "@/components/storefront/look-preview";
import { FavoriteButton } from "@/components/storefront/favorite-button";

export function LookCard({
  image,
  hotspots,
  annotations,
  categories,
  t,
}: {
  image: ShoppableImage;
  hotspots: Hotspot[];
  annotations: Annotation[];
  categories: Category[];
  t: Dictionary;
}) {
  const ownHotspots = hotspots.filter((h) => h.shoppableImageId === image._id && h.isActive);
  const itemCount = ownHotspots.length;
  const category = categories.find((c) => image.categoryIds.includes(c._id) && c.isActive);

  const meta = [
    itemCount > 0 ? (itemCount === 1 ? t.card.item : format(t.card.items, { n: itemCount })) : null,
    category?.name,
  ].filter(Boolean);

  return (
    <div className="group relative">
      <Link href={`/p/${image.slug}`} className="block">
        <LookPreview
          image={image}
          hotspots={ownHotspots}
          annotations={annotations.filter((a) => a.shoppableImageId === image._id)}
        />
        <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
        {meta.length > 0 && <p className="text-xs text-brown-soft">{meta.join(" · ")}</p>}
      </Link>
      <FavoriteButton imageId={image._id} className="absolute right-2 top-2" />
    </div>
  );
}
