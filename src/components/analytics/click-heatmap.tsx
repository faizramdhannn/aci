import type { HotspotHeat } from "@/lib/data";
import type { ShoppableImage } from "@/types";

/**
 * Approximates a click heatmap from per-hotspot click counts rather than raw
 * pointer coordinates (the product's CTA is a plain link, not a
 * coordinate-tracked click) — each hotspot's own normalized position becomes
 * a heat blob, sized and colored by its relative share of clicks.
 */
export function ClickHeatmap({ image, heat }: { image: ShoppableImage; heat: HotspotHeat[] }) {
  const maxClicks = Math.max(1, ...heat.map((h) => h.clicks));

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />

      {heat.map((h) => {
        if (h.clicks === 0) return null;
        const intensity = h.clicks / maxClicks;
        const size = 18 + intensity * 22; // percent of container width

        return (
          <div
            key={h.hotspotId}
            className="absolute rounded-full mix-blend-multiply"
            style={{
              left: `${h.x * 100}%`,
              top: `${h.y * 100}%`,
              width: `${size}%`,
              paddingBottom: `${size}%`,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, rgba(229,120,30,${0.55 * intensity + 0.15}) 0%, rgba(251,186,0,${0.3 * intensity}) 55%, transparent 75%)`,
            }}
          />
        );
      })}
    </div>
  );
}
