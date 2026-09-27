import Link from "next/link";
import Image from "next/image";
import type { ShopEntry } from "@/lib/data";
import { cropImageStyle, remapPoint } from "@/lib/crop";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { CategoryIcon } from "@/components/admin/category-icons";
import { LinkMarker } from "@/components/storefront/link-marker";
import { FavoriteButton } from "@/components/storefront/favorite-button";

/**
 * One shop card: a look's photo framed on the products of one category (a
 * 4:5 crop), with just those products' markers, labeled with the category.
 * The crop is done in CSS — the photo is scaled up and shifted inside an
 * overflow-hidden box — so no extra image files are generated.
 */
export function CategoryCropCard({ entry, t }: { entry: ShopEntry; t: Dictionary }) {
  const { image, category, crop, hotspots } = entry;
  // The photo renders 1/crop.width times the card width, so ask the
  // optimizer for a proportionally larger file to stay sharp when zoomed.
  const zoom = 1 / crop.width;
  const names = hotspots.map((h) => h.title).join(" · ");

  return (
    <div className="group relative">
      <Link href={`/p/${image.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-brown/5">
          <div className="absolute transition-transform duration-200 group-hover:scale-105" style={cropImageStyle(crop)}>
            <Image
              src={image.imageUrl}
              alt={`${category.name} — ${image.title}`}
              fill
              sizes={`(min-width: 768px) ${Math.round(25 * zoom)}vw, ${Math.round(50 * zoom)}vw`}
              className="object-cover"
            />
          </div>
          {hotspots.map((h) => {
            const p = remapPoint(h.x, h.y, crop);
            if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return null;
            return (
              <span
                key={h._id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              >
                <LinkMarker color={h.color} size={22} />
              </span>
            );
          })}
          <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-brown backdrop-blur">
            <CategoryIcon name={category.icon} className="h-3.5 w-3.5 text-orange" />
            {category.name}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-medium text-brown">{names}</p>
        <p className="truncate text-xs text-brown-soft">{format(t.shop.fromLook, { title: image.title })}</p>
      </Link>
      <FavoriteButton imageId={image._id} className="absolute right-2 top-2" />
    </div>
  );
}
