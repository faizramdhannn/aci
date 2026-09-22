"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function SearchPopover({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = variant === "mobile";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <form
        onSubmit={onSubmit}
        className={`overflow-hidden rounded-full transition-all duration-200 ${open ? "w-32 opacity-100 md:w-40" : "w-0 opacity-0"}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className={`w-full bg-transparent text-sm text-brown outline-none placeholder:text-brown-soft ${isMobile ? "" : "border-b border-brown/20 pb-0.5"}`}
        />
      </form>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Search"
        aria-expanded={open}
        className={
          isMobile
            ? "glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brown"
            : "flex shrink-0 items-center gap-1.5 text-sm font-medium text-brown-soft transition-colors hover:text-brown"
        }
      >
        <SearchIcon />
        {!isMobile && !open && <span>Search</span>}
      </button>
    </div>
  );
}
