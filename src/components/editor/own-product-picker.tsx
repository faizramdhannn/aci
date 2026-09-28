"use client";

import { useEffect, useState } from "react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";

interface Option {
  _id: string;
  title: string;
  slug: string;
  price: number;
}

/** Fills a look's product with one of the by.narras products (its link points into the store). */
export function OwnProductPicker({ onPick }: { onPick: (p: { title: string; url: string; price: number }) => void }) {
  const t = useStoreDictionary().admin.products;
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    fetch("/api/store/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setOptions)
      .catch(() => setOptions([]));
  }, []);

  if (options.length === 0) return null;
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-brown-soft">{t.linkFromStore}</span>
      <select
        defaultValue=""
        onChange={(e) => {
          const p = options.find((o) => o._id === e.target.value);
          if (p) onPick({ title: p.title, url: `${window.location.origin}/narras/p/${p.slug}`, price: p.price });
        }}
        className="w-full rounded-lg border border-brown/20 bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-orange"
      >
        <option value="">{t.chooseProduct}</option>
        {options.map((o) => (
          <option key={o._id} value={o._id}>
            {o.title}
          </option>
        ))}
      </select>
    </label>
  );
}
