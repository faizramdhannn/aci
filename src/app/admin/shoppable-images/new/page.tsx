import type { Metadata } from "next";
import { listCategories } from "@/lib/data";
import { NewShoppableImageForm } from "@/components/admin/new-shoppable-image-form";

export const metadata: Metadata = { title: "Upload a look" };
export const dynamic = "force-dynamic";

export default async function NewShoppableImagePage() {
  const categories = await listCategories();
  return <NewShoppableImageForm categories={categories.filter((c) => c.isActive)} />;
}
