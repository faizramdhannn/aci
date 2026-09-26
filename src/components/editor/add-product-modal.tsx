"use client";

import { useState } from "react";
import type { Category, Hotspot } from "@/types";
import { CategoryChipPicker } from "@/components/admin/category-chip-picker";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

const MARKER_COLORS = ["#5A3D2B", "#E5781E", "#FBBA00", "#2B1E17"];

export function AddProductModal({
  shoppableImageId,
  categories,
  onCreated,
  onClose,
}: {
  shoppableImageId: string;
  categories: Category[];
  onCreated: (hotspot: Hotspot) => void;
  onClose: () => void;
}) {
  const t = useAdminDictionary();
  const [title, setTitle] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState(MARKER_COLORS[0]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/hotspots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shoppableImageId,
        title,
        affiliateUrl,
        productPrice: price ? Number(price) : undefined,
        color,
        categoryIds,
        x: 0.5,
        y: 0.5,
        width: 0.08,
        height: 0.08,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(t.addProduct.failed);
      return;
    }

    onCreated(await res.json());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label={t.common.close} onClick={onClose} className="absolute inset-0 bg-brown/40 backdrop-blur-sm" />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm space-y-3 rounded-2xl border border-brown/10 bg-cream p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-brown">{t.addProduct.title}</p>
          <button type="button" onClick={onClose} aria-label={t.common.close} className="text-brown-soft hover:text-brown">
            ✕
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-brown-soft">{t.editor.productName}</span>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-brown/20 bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-brown-soft">{t.editor.affiliateUrl}</span>
          <input
            required
            type="url"
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-brown/20 bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-brown-soft">{t.editor.price}</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-brown/20 bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-orange"
          />
        </label>

        <div>
          <span className="mb-1 block text-xs text-brown-soft">{t.editor.markerColor}</span>
          <div className="flex items-center gap-1.5">
            {MARKER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-orange" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded-full border border-brown/20 bg-transparent p-0"
              aria-label={t.common.customColor}
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <span className="mb-1 block text-xs text-brown-soft">{t.common.categoriesOptional}</span>
            <CategoryChipPicker categories={categories} selectedIds={categoryIds} onToggle={toggleCategory} />
          </div>
        )}

        {error && <p className="text-xs text-orange">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-orange px-3 py-2 text-xs font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t.addProduct.adding : t.addProduct.submit}
        </button>
        <p className="text-[11px] text-brown-soft">{t.addProduct.hint}</p>
      </form>
    </div>
  );
}
