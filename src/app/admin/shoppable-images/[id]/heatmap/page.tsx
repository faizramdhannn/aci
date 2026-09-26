import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getShoppableImageById, getHeatmapForImage, listClickPointsForImage } from "@/lib/data";
import { ClickHeatmap } from "@/components/analytics/click-heatmap";
import { getAdminDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const [image, t] = await Promise.all([getShoppableImageById(id), getAdminDictionary()]);
  return { title: image ? format(t.heatmap.title, { title: image.title }) : t.editor.heatmap };
}

export default async function HeatmapPage({ params }: { params: Params }) {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  if (!image) notFound();

  const [heat, points, t] = await Promise.all([getHeatmapForImage(id), listClickPointsForImage(id), getAdminDictionary()]);
  const totalClicks = heat.reduce((sum, h) => sum + h.clicks, 0);
  const sorted = [...heat].sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brown">{format(t.heatmap.title, { title: image.title })}</h1>
          <p className="text-sm text-brown-soft">
            {points.length > 0 ? t.heatmap.real : t.heatmap.perProduct}
          </p>
        </div>
        <Link
          href={`/admin/shoppable-images/${id}/edit`}
          className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
        >
          {t.heatmap.back}
        </Link>
      </div>

      {totalClicks === 0 ? (
        <p className="mb-4 text-sm text-brown-soft">{t.heatmap.none}</p>
      ) : (
        <ClickHeatmap image={image} heat={heat} points={points} />
      )}

      {totalClicks === 0 && (
        <div
          className="relative w-full overflow-hidden rounded-2xl opacity-60"
          style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
        >
          <Image src={image.imageUrl} alt={image.title} fill sizes="672px" className="object-cover" />
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-6 rounded-xl border border-brown/10 bg-surface/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">{t.heatmap.listTitle}</h2>
          <ul className="space-y-2 text-sm">
            {sorted.map((h) => (
              <li key={h.hotspotId} className="flex items-center justify-between">
                <span className="text-brown">{h.title}</span>
                <span className="text-brown-soft">{format(t.common.clicks, { n: h.clicks })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
