"use client";

import { useState } from "react";
import type { Hotspot } from "@/types";

const MARKER_COLORS = ["#5A3D2B", "#E5781E", "#FBBA00", "#2B1E17"];

export function AddProductModal({
  shoppableImageId,
  onCreated,
  onClose,
}: {
  shoppableImageId: string;
  onCreated: (hotspot: Hotspot) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState(MARKER_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        x: 0.5,
        y: 0.5,
        width: 0.08,
        height: 0.08,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Check the affiliate URL and try again.");
      return;
    }

    onCreated(await res.json());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-brown/40 backdrop-blur-sm" />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm space-y-3 rounded-2xl border border-brown/10 bg-cream p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-brown">Add a product</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-brown-soft hover:text-brown">
            ✕
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-brown-soft">Product name</span>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-brown/20 bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-orange"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-brown-soft">Affiliate URL</span>
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
          <span className="mb-1 block text-xs text-brown-soft">Price (optional, IDR)</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-brown/20 bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-orange"
          />
        </label>

        <div>
          <span className="mb-1 block text-xs text-brown-soft">Marker color</span>
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
              aria-label="Custom color"
            />
          </div>
        </div>

        {error && <p className="text-xs text-orange">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-orange px-3 py-2 text-xs font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add to photo"}
        </button>
        <p className="text-[11px] text-brown-soft">It&apos;ll drop in the middle — drag it onto the right spot after.</p>
      </form>
    </div>
  );
}
