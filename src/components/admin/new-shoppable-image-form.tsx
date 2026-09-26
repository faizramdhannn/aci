"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField, type UploadedImage } from "@/components/editor/image-upload-field";
import { CategoryChipPicker } from "@/components/admin/category-chip-picker";
import type { Category } from "@/types";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

export function NewShoppableImageForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const t = useAdminDictionary();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<"upload" | "url">("upload");
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = source === "upload" ? !!uploaded : !!imageUrl.trim();

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const body =
      source === "upload" && uploaded
        ? { title, description, imageUrl: uploaded.url, imageWidth: uploaded.width, imageHeight: uploaded.height, categoryIds }
        : { title, description, imageUrl: imageUrl.trim(), categoryIds };

    const res = await fetch("/api/shoppable-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      setError(t.newLook.failed);
      return;
    }

    const image = await res.json();
    router.push(`/admin/shoppable-images/${image._id}/edit`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-brown">{t.newLook.title}</h1>
      <p className="mb-6 text-sm text-brown-soft">
        {t.newLook.intro}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-brown-soft">{t.newLook.titleLabel}</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.newLook.titlePlaceholder}
            className="w-full rounded-lg border border-brown/20 bg-surface/70 px-3 py-2 outline-none focus:border-orange"
          />
        </label>

        <div className="text-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-brown-soft">{t.newLook.photo}</span>
            <div className="ml-auto flex gap-1 rounded-full border border-brown/15 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSource("upload")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  source === "upload" ? "bg-brown text-cream" : "text-brown-soft"
                }`}
              >
                {t.newLook.upload}
              </button>
              <button
                type="button"
                onClick={() => setSource("url")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  source === "url" ? "bg-brown text-cream" : "text-brown-soft"
                }`}
              >
                {t.newLook.useUrl}
              </button>
            </div>
          </div>

          {source === "upload" ? (
            <ImageUploadField value={uploaded} onChange={setUploaded} />
          ) : (
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-brown/20 bg-surface/70 px-3 py-2 outline-none focus:border-orange"
            />
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-brown-soft">{t.newLook.description}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-brown/20 bg-surface/70 px-3 py-2 outline-none focus:border-orange"
          />
        </label>

        {categories.length > 0 && (
          <div className="text-sm">
            <span className="mb-2 block text-brown-soft">{t.common.categoriesOptional}</span>
            <CategoryChipPicker categories={categories} selectedIds={categoryIds} onToggle={toggleCategory} />
          </div>
        )}

        {error && <p className="text-sm text-orange">{error}</p>}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t.common.saving : t.newLook.submit}
        </button>
      </form>
    </div>
  );
}
