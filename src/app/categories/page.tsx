import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import type { Metadata } from "next";
import { CategoryIcon } from "@/components/admin/category-icons";
import { listCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <h1 className="mb-6 text-2xl font-semibold text-brown">Categories</h1>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category._id}
              className="flex items-center gap-2 rounded-full border border-brown/15 bg-surface/70 px-4 py-2 text-sm text-brown"
            >
              <CategoryIcon name={category.icon} className="h-4 w-4 text-orange" />
              {category.name}
            </span>
          ))}
        </div>
      </main>
      <BottomBar />
    </>
  );
}
