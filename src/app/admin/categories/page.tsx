import type { Metadata } from "next";
import { listCategories } from "@/lib/data";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).categories.title };
}
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, t] = await Promise.all([listCategories(), getAdminDictionary()]);

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-brown">{t.categories.title}</h1>
      <p className="mb-6 text-sm text-brown-soft">
        {t.categories.intro}
      </p>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
