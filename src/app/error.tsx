"use client";

import { useEffect } from "react";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[aci] unhandled page error:", error);
  }, [error]);

  return (
    <>
      <TopBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-display text-4xl text-orange">Oops.</p>
        <h1 className="mt-3 text-2xl font-semibold text-brown">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-brown-soft">
          That&apos;s on us, not you. Try again, or come back in a moment.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </main>
      <BottomBar />
    </>
  );
}
