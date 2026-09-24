"use client";

import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { useDictionary } from "@/components/i18n/locale-provider";

export function FavoriteButton({ imageId, className = "" }: { imageId: string; className?: string }) {
  const t = useDictionary();
  const [favorited, setFavorited] = useState(false);

  // Read from localStorage only after mount so server and first client
  // render match (avoids a hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage, an external source React can't see during render
    setFavorited(isFavorite(imageId));
  }, [imageId]);

  return (
    <button
      type="button"
      aria-label={favorited ? t.favorites.remove : t.favorites.add}
      aria-pressed={favorited}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorited(toggleFavorite(imageId).includes(imageId));
      }}
      className={`flex items-center justify-center rounded-full bg-surface/90 p-2 shadow-sm backdrop-blur transition-transform hover:scale-110 ${className}`}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill={favorited ? "#E5781E" : "none"} stroke="#E5781E" strokeWidth="2">
        <path
          d="M12 21s-6.7-4.35-9.33-8.36C.86 9.94 1.7 6.3 4.86 5.06 7 4.22 9.3 5 10.6 6.8L12 8.6l1.4-1.8c1.3-1.8 3.6-2.58 5.74-1.74 3.16 1.24 4 4.88 2.19 7.58C18.7 16.65 12 21 12 21z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
