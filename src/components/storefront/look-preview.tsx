import type { Annotation, Hotspot, ShoppableImage as ShoppableImageType } from "@/types";
import { LinkMarker } from "@/components/storefront/link-marker";
import { AnnotationOverlay } from "@/components/storefront/annotation-overlay";

/**
 * A non-interactive preview of a shoppable image for use in grids (home,
 * shop, categories): shows the same hotspot markers, arrows, and text as
 * the full page, but nothing is clickable and no view is tracked — the
 * whole card is meant to be wrapped in a single Link to the look itself.
 */
export function LookPreview({
  image,
  hotspots,
  annotations = [],
}: {
  image: ShoppableImageType;
  hotspots: Hotspot[];
  annotations?: Annotation[];
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.imageUrl}
        alt={image.title}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />

      <AnnotationOverlay annotations={annotations} imageWidth={image.imageWidth} imageHeight={image.imageHeight} />

      {hotspots
        .filter((h) => h.isActive)
        .map((hotspot) => (
          <div
            key={hotspot._id}
            className="absolute flex items-center justify-center"
            style={{
              left: `${hotspot.x * 100}%`,
              top: `${hotspot.y * 100}%`,
              width: `${hotspot.width * 100}%`,
              height: `${hotspot.height * 100}%`,
              transform: `translate(-50%, -50%) rotate(${hotspot.rotation}deg)`,
              minWidth: 20,
              minHeight: 20,
            }}
          >
            <LinkMarker color={hotspot.color} size={18} />
          </div>
        ))}
    </div>
  );
}
