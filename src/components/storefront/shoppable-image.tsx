"use client";

import { useEffect, useState } from "react";
import type { Hotspot, ShoppableImage as ShoppableImageType } from "@/types";
import { ProductPanel } from "@/components/storefront/product-panel";

export function ShoppableImage({
  image,
  hotspots,
  trackView = true,
}: {
  image: ShoppableImageType;
  hotspots: Hotspot[];
  trackView?: boolean;
}) {
  const [selected, setSelected] = useState<Hotspot | null>(null);

  useEffect(() => {
    if (!trackView) return;
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shoppableImageId: image._id,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        referrer: document.referrer || undefined,
      }),
      keepalive: true,
    }).catch(() => {
      /* view tracking is best-effort */
    });
     
  }, [image._id, trackView]);

  return (
    <div className="relative">
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />

        {hotspots
          .filter((h) => h.isActive)
          .map((hotspot) => (
            <button
              key={hotspot._id}
              aria-label={hotspot.title}
              onClick={() => setSelected(hotspot)}
              className="group absolute flex items-center justify-center rounded-full border border-cream/70 bg-brown/85 shadow-sm transition-transform duration-200 hover:scale-110"
              style={{
                left: `${hotspot.x * 100}%`,
                top: `${hotspot.y * 100}%`,
                width: `${hotspot.width * 100}%`,
                height: `${hotspot.height * 100}%`,
                transform: `translate(-50%, -50%) rotate(${hotspot.rotation}deg)`,
                minWidth: 28,
                minHeight: 28,
              }}
            >
              <span className="block h-2 w-2 rounded-full bg-yellow transition-transform duration-200 group-hover:scale-125" />
            </button>
          ))}
      </div>

      {/* Desktop: anchored popover */}
      {selected && (
        <div className="glass absolute bottom-4 left-4 right-4 z-10 hidden rounded-2xl p-4 md:block">
          <ProductPanel hotspot={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
          <div className="glass rounded-t-3xl p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <ProductPanel hotspot={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
      {selected && (
        <button
          aria-label="Close product panel"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-40 md:hidden"
        />
      )}
    </div>
  );
}
