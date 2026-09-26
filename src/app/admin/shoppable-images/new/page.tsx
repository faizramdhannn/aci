import type { Metadata } from "next";
import { listCategories } from "@/lib/data";
import { NewShoppableImageForm } from "@/components/admin/new-shoppable-image-form";
import { getAdminDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).newLook.title };
}
export const dynamic = "force-dynamic";

export default async function NewShoppableImagePage() {
  const categories = await listCategories();
  return <NewShoppableImageForm categories={categories.filter((c) => c.isActive)} />;
}
