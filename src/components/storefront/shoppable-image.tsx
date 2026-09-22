"use client";

import { useEffect } from "react";
import type { Annotation, Hotspot, ShoppableImage as ShoppableImageType } from "@/types";
import { LinkMarker } from "@/components/storefront/link-marker";
import { ArrowOverlay } from "@/components/storefront/arrow-overlay";

export function ShoppableImage({
  image,
  hotspots,
  annotations = [],
  trackView = true,
}: {
  image: ShoppableImageType;
  hotspots: Hotspot[];
  annotations?: Annotation[];
  trackView?: boolean;
}) {
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
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />

      <ArrowOverlay annotations={annotations} />

      {hotspots
        .filter((h) => h.isActive)
        .map((hotspot) => (
          <a
            key={hotspot._id}
            href={`/go/${hotspot._id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Shop ${hotspot.title}`}
            title={hotspot.title}
            className="group absolute flex items-center justify-center transition-transform duration-200 hover:scale-110"
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
            <LinkMarker color={hotspot.color} size={26} />
          </a>
        ))}
    </div>
  );
}
