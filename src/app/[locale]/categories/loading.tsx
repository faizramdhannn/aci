import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { GridSkeleton } from "@/components/storefront/grid-skeleton";

export default function CategoriesLoading() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <div className="mb-6 h-8 w-36 animate-pulse rounded-lg bg-brown/10" />
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-brown/10" />
          ))}
        </div>
        <GridSkeleton />
      </main>
      <BottomBar />
    </>
  );
}
