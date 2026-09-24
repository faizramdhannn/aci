import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listShoppableImages, getAnalyticsSummary } from "@/lib/data";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const images = await listShoppableImages();
  const summary = await getAnalyticsSummary();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brown">Overview</h1>
        <Link
          href="/admin/shoppable-images/new"
          className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Upload a look
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Views" value={summary.totalViews} />
        <StatCard label="Clicks" value={summary.totalClicks} />
        <StatCard label="CTR" value={`${(summary.ctr * 100).toFixed(1)}%`} />
        <StatCard label="Sessions" value={summary.uniqueSessions} />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-brown">Shoppable images</h2>
      {images.length === 0 ? (
        <p className="text-brown-soft">No shoppable images yet. Upload your first look to start adding product links.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <Link
              key={image._id}
              href={`/admin/shoppable-images/${image._id}/edit`}
              className="group block"
            >
              <div
                className="relative overflow-hidden rounded-xl border border-brown/10"
                style={{ aspectRatio: `${image.imageWidth} / ${image.imageHeight}` }}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute right-2 top-2 rounded-full bg-brown/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cream">
                  {image.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-brown">{image.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
      <p className="text-xs uppercase tracking-wide text-brown-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brown">{value}</p>
    </div>
  );
}
