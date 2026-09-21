import { notFound } from "next/navigation";
import Link from "next/link";
import { getShoppableImageById, listHotspotsForImage } from "@/lib/data";
import { HotspotEditor } from "@/components/editor/hotspot-editor";
import { PublishToggle } from "@/components/editor/publish-toggle";
import { ChangePhoto } from "@/components/editor/change-photo";

type Params = Promise<{ id: string }>;

export default async function EditShoppableImagePage({ params }: { params: Params }) {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  if (!image) notFound();

  const hotspots = await listHotspotsForImage(image._id);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brown">{image.title}</h1>
          <p className="text-sm text-brown-soft">Drag hotspots onto the photo, resize with the handles.</p>
        </div>
        <div className="flex items-center gap-2">
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
      <HotspotEditor image={image} initialHotspots={hotspots} />
    </div>
  );
}
