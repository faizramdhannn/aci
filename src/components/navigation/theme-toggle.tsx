"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  try {
    localStorage.setItem("aci-theme", theme);
  } catch {
    /* private browsing / blocked storage — theme just won't persist */
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("aci-theme");
    } catch {
      /* ignore */
    }
    const effective: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.classList.add(effective);
    // One-time sync from an external source (localStorage/matchMedia) on
    // mount — not a derived-state anti-pattern, there's no other way to
    // know the resolved theme before the client has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(effective);
  }, []);

  if (!theme) {
    return <span className={`inline-block h-9 w-9 ${className}`} aria-hidden />;
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-brown transition-colors hover:bg-brown/5 ${className}`}
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a.6.6 0 0 0-.75-.75A9.7 9.7 0 1 0 21.25 15a.6.6 0 0 0-.75-.7Z" />
        </svg>
      )}
    </button>
  );
}
