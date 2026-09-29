"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { useDictionary } from "@/components/i18n/locale-provider";

// A client error boundary can't render the async (server) TopBar, so it
// shows a minimal home link instead.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useDictionary();

  useEffect(() => {
    console.error("[aci] unhandled page error:", error);
  }, [error]);

  return (
    <>
      <header className="px-6 pt-6">
        <Link href="/" className="text-sm font-medium text-brown-soft hover:text-brown">
          ← {t.nav.home}
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-display text-4xl text-orange">{t.error.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold text-brown">{t.error.title}</h1>
        <p className="mt-2 max-w-sm text-brown-soft">{t.error.body}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          {t.error.retry}
        </button>
      </main>
      <BottomBar />
    </>
  );
}
