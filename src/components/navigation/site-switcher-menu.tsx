"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";

export interface SiteOption {
  key: "outfit" | "store";
  name: string;
  href: string;
  logo?: string;
  /** Logo image already includes the name (e.g. a wordmark), so don't repeat it as text. */
  logoHasName?: boolean;
}

function Mark({ site, size }: { site: SiteOption; size: number }) {
  if (!site.logo) return null;
  return (
    <Image
      src={site.logo}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-cream object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** The site logo doubles as a switcher: tap it to see both sites, with the current one marked. */
export function SiteSwitcherMenu({
  sites,
  current,
  compact = false,
}: {
  sites: SiteOption[];
  current: SiteOption["key"];
  compact?: boolean;
}) {
  const t = useStoreDictionary().switcher;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = sites.find((s) => s.key === current)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.label}: ${active.name}`}
        className={`flex items-center gap-2 rounded-full font-semibold text-brown transition-colors hover:bg-brown/5 ${
          compact ? "px-2 py-1 text-lg" : "px-2.5 py-1.5 text-2xl"
        }`}
      >
        <Mark site={active} size={compact ? 24 : 30} />
        <span className={active.key === "outfit" ? "font-display" : "tracking-tight"}>{active.name}</span>
        <ChevronDown className={`h-4 w-4 text-brown-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-brown/10 bg-surface p-1.5 shadow-lg"
        >
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-brown-soft">{t.label}</p>
          {sites.map((site) => {
            const isActive = site.key === current;
            return (
              <Link
                key={site.key}
                href={site.href}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  isActive ? "bg-brown/10" : "hover:bg-brown/5"
                }`}
              >
                {site.logo ? (
                  <Mark site={site} size={36} />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/15 text-sm font-semibold text-orange">
                    {site.name.replace(/^by\./, "").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brown">{site.name}</span>
                  {isActive && <span className="block text-xs text-brown-soft">{t.current}</span>}
                </span>
                {isActive && <Check className="h-4 w-4 text-orange" />}
              </Link>
            );
          })}
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl border-t border-brown/10 px-3 py-2 text-xs text-brown-soft hover:text-brown"
          >
            ← {t.home}
          </Link>
        </div>
      )}
    </div>
  );
}
