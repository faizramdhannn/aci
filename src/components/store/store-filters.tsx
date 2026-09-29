"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, Switch, ToggleGroup } from "radix-ui";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { StoreCollection } from "@/types/store";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { SORTS } from "@/lib/store/catalog";
import { useAppPathname } from "@/lib/use-app-pathname";

const ALL = "all";

/** A Radix Select styled like the store's pills. */
function PillSelect({
  value,
  onValueChange,
  label,
  options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        aria-label={label}
        className="inline-flex items-center gap-2 rounded-full border border-brown/20 bg-surface px-4 py-2 text-sm text-brown outline-none transition-colors hover:border-brown/50 focus-visible:border-brown data-[state=open]:border-brown"
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-brown-soft" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-brown/10 bg-surface p-1 text-sm text-brown shadow-lg"
        >
          <Select.Viewport>
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-4 outline-none data-[highlighted]:bg-brown/10 data-[state=checked]:font-semibold"
              >
                <Select.ItemIndicator className="absolute left-2.5">
                  <Check className="h-4 w-4 text-orange" />
                </Select.ItemIndicator>
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/** Search box, collection chips, colour/sort menus and an in-stock switch (Radix UI), all kept in the URL. */
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

  const collection = params.get("collection") ?? ALL;
  const inStock = params.get("stock") === "1";
  const filtered = Boolean(params.get("q") || params.get("collection") || params.get("colour") || inStock || params.get("sort"));

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
        <ToggleGroup.Root
          type="single"
          value={collection}
          // Radix sends "" when the active chip is clicked again; keep one selected.
          onValueChange={(v) => v && update({ collection: v === ALL ? null : v })}
          aria-label={t.all}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {[{ slug: ALL, name: t.all, _id: ALL }, ...collections].map((c) => (
            <ToggleGroup.Item
              key={c._id}
              value={c.slug}
              className="shrink-0 whitespace-nowrap rounded-full border border-brown/20 px-4 py-1.5 text-sm text-brown outline-none transition-colors hover:border-brown/50 focus-visible:ring-2 focus-visible:ring-brown/30 data-[state=on]:border-brown data-[state=on]:bg-brown data-[state=on]:text-cream"
            >
              {c.name}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {colours.length > 1 && (
          <PillSelect
            label={t.colour_}
            value={params.get("colour") ?? ALL}
            onValueChange={(v) => update({ colour: v === ALL ? null : v })}
            options={[{ value: ALL, label: t.allColours }, ...colours.map((c) => ({ value: c, label: c }))]}
          />
        )}
        <PillSelect
          label={t.sortBy}
          value={params.get("sort") ?? "newest"}
          onValueChange={(v) => update({ sort: v === "newest" ? null : v })}
          options={SORTS.map((s) => ({ value: s, label: t.sorts[s] }))}
        />
        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-brown">
          <Switch.Root
            checked={inStock}
            onCheckedChange={(on) => update({ stock: on ? "1" : null })}
            className="relative h-5 w-9 shrink-0 rounded-full bg-brown/20 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brown/30 data-[state=checked]:bg-brown"
          >
            <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-cream shadow transition-transform data-[state=checked]:translate-x-[18px]" />
          </Switch.Root>
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
