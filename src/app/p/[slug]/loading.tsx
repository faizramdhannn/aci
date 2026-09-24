import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";

export default function LookLoading() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <div className="animate-pulse rounded-2xl bg-brown/10" style={{ aspectRatio: "3 / 4" }} />
        <div className="mt-6">
          <div className="h-6 w-1/2 animate-pulse rounded bg-brown/10" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-brown/10" />
        </div>
      </main>
      <BottomBar />
    </>
  );
}
