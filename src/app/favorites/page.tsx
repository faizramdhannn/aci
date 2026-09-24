import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { FavoritesGrid } from "@/components/storefront/favorites-grid";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-28 pt-8 md:pb-16">
        <h1 className="mb-6 text-2xl font-semibold text-brown">Favorites</h1>
        <FavoritesGrid />
      </main>
      <BottomBar />
    </>
  );
}
