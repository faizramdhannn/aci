import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { FavoritesGrid } from "@/components/storefront/favorites-grid";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).favorites.title };
}

export default async function FavoritesPage() {
  const t = await getDictionary();
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8">
        <h1 className="mb-6 text-2xl font-semibold text-brown">{t.favorites.title}</h1>
        <FavoritesGrid />
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
