import Link from "next/link";
import type { Metadata } from "next";
import { listShoppableImages } from "@/lib/data";
import { ShoppableImagesTable } from "@/components/admin/shoppable-images-table";
import { getAdminDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).looks.title };
}
export const dynamic = "force-dynamic";

export default async function AdminShoppableImagesPage() {
  const [images, t] = await Promise.all([listShoppableImages(), getAdminDictionary()]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brown">{t.looks.title}</h1>
        <Link
          href="/admin/shoppable-images/new"
          className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          {t.overview.upload}
        </Link>
      </div>

      <ShoppableImagesTable initialImages={images} />
    </div>
  );
}
