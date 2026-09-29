import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).notFound.title };
}

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <>
      <TopBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-display text-4xl text-orange">{t.notFound.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold text-brown">{t.notFound.title}</h1>
        <p className="mt-2 max-w-sm text-brown-soft">{t.notFound.body}</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          {t.notFound.back}
        </Link>
      </main>
      <BottomBar />
    </>
  );
}
