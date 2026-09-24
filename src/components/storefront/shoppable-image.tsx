"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Annotation, Hotspot, ShoppableImage as ShoppableImageType } from "@/types";
import { LinkMarker } from "@/components/storefront/link-marker";
import { AnnotationOverlay } from "@/components/storefront/annotation-overlay";

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
  const containerRef = useRef<HTMLDivElement>(null);

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
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
    >
      <Image
        src={image.imageUrl}
        alt={image.title}
        fill
        sizes="(min-width: 768px) 672px, 100vw"
        priority
        className="object-cover"
      />

      <AnnotationOverlay annotations={annotations} imageWidth={image.imageWidth} imageHeight={image.imageHeight} />

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
            onClick={(e) => {
              // Attach the real click position (normalized to the photo) so
              // the admin heatmap can show true per-pixel density instead of
              // just bucketing every click onto the hotspot's own position.
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              e.preventDefault();
              const cx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
              const cy = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
              window.open(
                `/go/${hotspot._id}?cx=${cx.toFixed(4)}&cy=${cy.toFixed(4)}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
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
