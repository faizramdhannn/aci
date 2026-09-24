import Link from "next/link";
import type { Metadata } from "next";
import { listShoppableImages } from "@/lib/data";
import { ShoppableImagesTable } from "@/components/admin/shoppable-images-table";

export const metadata: Metadata = { title: "Shoppable Images" };
export const dynamic = "force-dynamic";

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

      <ShoppableImagesTable initialImages={images} />
    </div>
  );
}
