import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getShoppableImageById, listHotspotsForImage, listAnnotationsForImage, listCategories } from "@/lib/data";
import { HotspotEditor } from "@/components/editor/hotspot-editor";
import { PublishToggle } from "@/components/editor/publish-toggle";
import { ChangePhoto } from "@/components/editor/change-photo";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  return { title: image ? `Edit ${image.title}` : "Edit look" };
}

export default async function EditShoppableImagePage({ params }: { params: Params }) {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  if (!image) notFound();

  const [hotspots, annotations, categories] = await Promise.all([
    listHotspotsForImage(image._id),
    listAnnotationsForImage(image._id),
    listCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brown">{image.title}</h1>
          <p className="text-sm text-brown-soft">Drag hotspots onto the photo, resize with the handles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/shoppable-images/${image._id}/heatmap`}
            className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
          >
            Heatmap
          </Link>
          <ChangePhoto imageId={image._id} />
          <PublishToggle imageId={image._id} status={image.status} />
        </div>
      </div>
      <HotspotEditor
        image={image}
        initialHotspots={hotspots}
        initialAnnotations={annotations}
        categories={categories.filter((c) => c.isActive)}
      />
    </div>
  );
}
