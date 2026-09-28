import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { GridSkeleton } from "@/components/storefront/grid-skeleton";

export default function HomeLoading() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <div className="mb-4 h-9 w-64 animate-pulse rounded-lg bg-brown/10" />
        <div
          className="mb-12 mt-6 max-w-md animate-pulse rounded-2xl bg-brown/10"
          style={{ aspectRatio: "3 / 4" }}
        />
        <div className="mb-4 h-6 w-32 animate-pulse rounded-lg bg-brown/10" />
        <GridSkeleton count={6} cols="grid-cols-2 md:grid-cols-3" />
      </main>
      <BottomBar />
    </>
  );
}
