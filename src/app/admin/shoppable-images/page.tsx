import Link from "next/link";
import { listShoppableImages } from "@/lib/data";

export default async function AdminShoppableImagesPage() {
  const images = await listShoppableImages();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brown">Shoppable images</h1>
        <Link
          href="/admin/shoppable-images/new"
          className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Upload a look
        </Link>
      </div>

      {images.length === 0 ? (
        <p className="text-brown-soft">No shoppable images yet. Upload your first look to start adding product links.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brown/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-brown/5 text-xs uppercase tracking-wide text-brown-soft">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {images.map((image) => (
                <tr key={image._id} className="border-t border-brown/10">
                  <td className="px-4 py-3 font-medium text-brown">{image.title}</td>
                  <td className="px-4 py-3 capitalize text-brown-soft">{image.status}</td>
                  <td className="px-4 py-3 text-brown-soft">
                    {new Date(image.updatedAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/shoppable-images/${image._id}/edit`} className="text-orange hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
