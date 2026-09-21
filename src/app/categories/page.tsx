import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { listCategories } from "@/lib/data";

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
              className="rounded-full border border-brown/15 bg-white/40 px-4 py-2 text-sm text-brown"
            >
              {category.name}
            </span>
          ))}
        </div>
      </main>
      <BottomBar />
    </>
  );
}
