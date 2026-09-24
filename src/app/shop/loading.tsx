import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { GridSkeleton } from "@/components/storefront/grid-skeleton";

export default function ShopLoading() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <div className="mb-6 h-8 w-24 animate-pulse rounded-lg bg-brown/10" />
        <GridSkeleton />
      </main>
      <BottomBar />
    </>
  );
}
