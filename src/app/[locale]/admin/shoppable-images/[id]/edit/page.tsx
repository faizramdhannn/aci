import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getShoppableImageById, getSiteSettings, listHotspotsForImage, listAnnotationsForImage, listCategories } from "@/lib/data";
import { HotspotEditor } from "@/components/editor/hotspot-editor";
import { PublishToggle } from "@/components/editor/publish-toggle";
import { ChangePhoto } from "@/components/editor/change-photo";
import { LookCategoriesEditor } from "@/components/editor/look-categories-editor";
import { FeaturedToggle } from "@/components/editor/featured-toggle";
import { ReframePhoto } from "@/components/editor/reframe-photo";
import { getAdminDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const [image, t] = await Promise.all([getShoppableImageById(id), getAdminDictionary()]);
  return { title: image ? `${t.common.edit}: ${image.title}` : t.common.edit };
}

export default async function EditShoppableImagePage({ params }: { params: Params }) {
  const { id } = await params;
  const image = await getShoppableImageById(id);
  if (!image) notFound();

  const [hotspots, annotations, categories, t, settings] = await Promise.all([
    listHotspotsForImage(image._id),
    listAnnotationsForImage(image._id),
    listCategories(),
    getAdminDictionary(),
    getSiteSettings(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brown">{image.title}</h1>
          <p className="text-sm text-brown-soft">{t.editor.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/shoppable-images/${image._id}/heatmap`}
            className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
          >
            {t.editor.heatmap}
          </Link>
          <ChangePhoto imageId={image._id} />
          <ReframePhoto
            imageId={image._id}
            imageUrl={image.imageUrl}
            imageWidth={image.imageWidth}
            imageHeight={image.imageHeight}
          />
          <FeaturedToggle imageId={image._id} featured={Boolean(image.featured)} />
          <PublishToggle imageId={image._id} status={image.status} />
        </div>
      </div>
      <LookCategoriesEditor
        imageId={image._id}
        categories={categories.filter((c) => c.isActive)}
        initialCategoryIds={image.categoryIds}
      />
      <HotspotEditor
        // Remount when the photo changes (replace/crop) so local marker state reloads from the server.
        key={image.imageUrl}
        image={image}
        initialHotspots={hotspots}
        initialAnnotations={annotations}
        categories={categories.filter((c) => c.isActive)}
        siteName={settings.siteName}
      />
    </div>
  );
}
