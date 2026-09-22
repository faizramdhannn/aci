import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getShoppableImageById, getHeatmapForImage } from "@/lib/data";
import { ClickHeatmap } from "@/components/analytics/click-heatmap";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  return { title: image ? `${image.title} heatmap` : "Heatmap" };
}

export default async function HeatmapPage({ params }: { params: Params }) {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  if (!image) notFound();

  const heat = await getHeatmapForImage(id);
  const totalClicks = heat.reduce((sum, h) => sum + h.clicks, 0);
  const sorted = [...heat].sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brown">{image.title} — click heatmap</h1>
          <p className="text-sm text-brown-soft">Which product on this look gets the most attention.</p>
        </div>
        <Link
          href={`/admin/shoppable-images/${id}/edit`}
          className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
        >
          Back to editor
        </Link>
      </div>

      {totalClicks === 0 ? (
        <p className="mb-4 text-sm text-brown-soft">No clicks recorded on this look yet.</p>
      ) : (
        <ClickHeatmap image={image} heat={heat} />
      )}

      {totalClicks === 0 && (
        <div
          className="relative w-full overflow-hidden rounded-2xl opacity-60"
          style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.imageUrl} alt={image.title} className="h-full w-full object-cover" />
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-6 rounded-xl border border-brown/10 bg-surface/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">Clicks per product</h2>
          <ul className="space-y-2 text-sm">
            {sorted.map((h) => (
              <li key={h.hotspotId} className="flex items-center justify-between">
                <span className="text-brown">{h.title}</span>
                <span className="text-brown-soft">{h.clicks} clicks</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
