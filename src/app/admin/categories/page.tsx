import { listCategories } from "@/lib/data";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-brown">Categories</h1>
      <p className="mb-6 text-sm text-brown-soft">
        Organize looks by category. Reorder with the arrows — this is the order shown on the public site.
      </p>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
