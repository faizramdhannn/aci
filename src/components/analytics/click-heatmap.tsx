import Image from "next/image";
import type { HotspotHeat } from "@/lib/data";
import type { ShoppableImage } from "@/types";

/**
 * Renders a click heatmap. When raw click positions are available (clicks
 * recorded since click-position tracking shipped), it draws a true
 * per-pixel density cloud from those points. Older clicks predate that and
 * only have a per-hotspot count, so as a fallback each hotspot's own
 * position becomes a single heat blob sized by its share of clicks.
 */
export function ClickHeatmap({
  image,
  heat,
  points = [],
}: {
  image: ShoppableImage;
  heat: HotspotHeat[];
  points?: { x: number; y: number }[];
}) {
  const maxClicks = Math.max(1, ...heat.map((h) => h.clicks));

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
    >
      <Image src={image.imageUrl} alt={image.title} fill sizes="672px" className="object-cover" />

      {points.length > 0
        ? points.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full mix-blend-multiply"
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                width: "9%",
                paddingBottom: "9%",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(229,120,30,0.45) 0%, rgba(251,186,0,0.22) 55%, transparent 75%)",
              }}
            />
          ))
        : heat.map((h) => {
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
