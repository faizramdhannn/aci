import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-display text-4xl text-orange">Hmm.</p>
        <h1 className="mt-3 text-2xl font-semibold text-brown">This page doesn&apos;t exist</h1>
        <p className="mt-2 max-w-sm text-brown-soft">
          The look or page you&apos;re looking for may have been moved, unpublished, or never existed.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Back to Aci
        </Link>
      </main>
      <BottomBar />
    </>
  );
}
