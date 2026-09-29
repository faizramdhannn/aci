"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { StoreCollection } from "@/types/store";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { SORTS } from "@/lib/store/catalog";
import { useAppPathname } from "@/lib/use-app-pathname";

const select =
  "rounded-full border border-brown/20 bg-surface px-3 py-2 text-sm text-brown outline-none focus:border-brown";

/** Search box, collection chips, colour/sort menus and an in-stock toggle, all kept in the URL. */
export function StoreFilters({ collections, colours }: { collections: StoreCollection[]; colours: string[] }) {
  const t = useStoreDictionary().store;
  const router = useRouter();
  const pathname = useAppPathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}#products`, { scroll: false });
  };

  // Search as you type, a moment after the last keystroke.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should trigger this
  }, [q]);

  const active = params.get("collection");
  const chip = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
      on ? "border-brown bg-brown text-cream" : "border-brown/20 text-brown hover:border-brown/50"
    }`;
  const filtered = Boolean(params.get("q") || active || params.get("colour") || params.get("stock") || params.get("sort"));

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-soft" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="w-full rounded-full border border-brown/20 bg-surface py-2.5 pl-10 pr-4 text-sm text-brown outline-none focus:border-brown"
        />
      </div>

      {collections.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" onClick={() => update({ collection: null })} className={chip(!active)}>
            {t.all}
          </button>
          {collections.map((c) => (
            <button key={c._id} type="button" onClick={() => update({ collection: c.slug })} className={chip(active === c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {colours.length > 1 && (
          <select
            value={params.get("colour") ?? ""}
            onChange={(e) => update({ colour: e.target.value || null })}
            aria-label={t.colour_}
            className={select}
          >
            <option value="">{t.allColours}</option>
            {colours.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <select
          value={params.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          aria-label={t.sortBy}
          className={select}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t.sorts[s]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-2 text-sm text-brown">
          <input
            type="checkbox"
            checked={params.get("stock") === "1"}
            onChange={(e) => update({ stock: e.target.checked ? "1" : null })}
            className="accent-[var(--color-brown)]"
          />
          {t.inStockOnly}
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              router.replace(`${pathname}#products`, { scroll: false });
            }}
            className="ml-auto flex items-center gap-1 text-xs text-brown-soft hover:text-brown"
          >
            <X className="h-3.5 w-3.5" />
            {t.resetFilters}
          </button>
        )}
      </div>
    </div>
  );
}
