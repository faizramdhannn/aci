"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const POLL_MS = 60_000;

/**
 * Keeps open pages up to date with admin edits: re-renders the current page
 * (server data only; scroll position and typed input are kept) when the tab
 * comes back into view, and when /api/version reports a change while it's open.
 */
export function LiveRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const version = useRef<string | null>(null);

  // The admin refreshes itself after each save; auto-refreshing mid-edit would get in the way.
  const enabled = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;

    async function check(refreshAnyway: boolean) {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { v } = (await res.json()) as { v: string };
        const changed = version.current !== null && v !== version.current;
        version.current = v;
        if (!stopped && (changed || refreshAnyway)) router.refresh();
      } catch {
        /* offline — try again later */
      }
    }

    check(false);
    const timer = window.setInterval(() => check(false), POLL_MS);
    const onVisible = () => {
      if (!document.hidden) check(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router, pathname, enabled]);

  return null;
}
