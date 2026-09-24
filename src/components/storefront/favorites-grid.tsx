"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ShoppableImage } from "@/types";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { getFavoriteIds } from "@/lib/favorites";

export function FavoritesGrid() {
  const [images, setImages] = useState<ShoppableImage[] | null>(null);

  useEffect(() => {
    const ids = new Set(getFavoriteIds());
    if (ids.size === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage, an external source React can't see during render
      setImages([]);
      return;
    }
    fetch("/api/shoppable-images")
      .then((res) => res.json())
      .then((all: ShoppableImage[]) => setImages(all.filter((i) => i.status === "published" && ids.has(i._id))))
      .catch(() => setImages([]));
  }, []);

  if (images === null) return <p className="text-brown-soft">Loading…</p>;

  if (images.length === 0) {
    return <p className="text-brown-soft">Nothing saved yet. Tap the heart on a look to save it here.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {images.map((image) => (
        <div key={image._id} className="group relative">
          <Link href={`/p/${image.slug}`} className="block">
            <div
              className="relative overflow-hidden rounded-xl"
              style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
            >
              <Image
                src={image.imageUrl}
                alt={image.title}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
          </Link>
          <FavoriteButton imageId={image._id} className="absolute right-2 top-2" />
        </div>
      ))}
    </div>
  );
}
