"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { StoreCollection, StoreProduct, StoreVariant } from "@/types/store";
import { ImageUploadField } from "@/components/editor/image-upload-field";
import { Card, adminInput, primaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { format } from "@/lib/i18n/dictionaries";

type Draft = Omit<StoreProduct, "_id" | "slug" | "createdAt" | "updatedAt">;

const EMPTY: Draft = {
  title: "",
  description: "",
  price: 0,
  images: [],
  variants: [{ id: "v-1", name: "", stock: 0 }],
  status: "draft",
};

const digits = (value: string) => value.replace(/\D/g, "");
const newVariantId = () => `v-${Math.random().toString(36).slice(2, 10)}`;

export function ProductForm({ product, collections }: { product?: StoreProduct; collections: StoreCollection[] }) {
  const t = useStoreDictionary();
  const p = t.admin.products;
  const toast = useToast();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(product ?? EMPTY);
  const [compareAt, setCompareAt] = useState(product?.compareAtPrice ? String(product.compareAtPrice) : "");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setVariant = (i: number, patch: Partial<StoreVariant>) =>
    set(
      "variants",
      draft.variants.map((v, j) => (j === i ? { ...v, ...patch } : v))
    );
  const moveImage = (i: number, dir: -1 | 1) => {
    const next = [...draft.images];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set("images", next);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { ...draft, compareAtPrice: compareAt ? Number(compareAt) : null };
    const res = await fetch(product ? `/api/store/products/${product._id}` : "/api/store/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const field = data.field ? (p as Record<string, string>)[data.field === "title" ? "titleLabel" : data.field] ?? data.field : "";
      toast(format(p.failed, { field }), "error");
      return;
    }
    toast(p.saved);
    if (product) router.refresh();
    else router.replace(`/admin/store/products/${data._id}`);
  }

  async function onDelete() {
    if (!product || !window.confirm(p.deleteConfirm)) return;
    const res = await fetch(`/api/store/products/${product._id}`, { method: "DELETE" });
    if (!res.ok) return;
    toast(p.deleted);
    router.replace("/admin/store/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Card>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{p.titleLabel}</span>
            <input required maxLength={120} value={draft.title} onChange={(e) => set("title", e.target.value)} className={adminInput} />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{p.description}</span>
            <textarea
              rows={6}
              maxLength={4000}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className={adminInput}
            />
          </label>
        </Card>

        <Card title={p.media}>
          <p className="-mt-2 mb-3 text-xs text-brown-soft">{p.mediaHint}</p>
          {draft.images.length > 0 && (
            <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {draft.images.map((src, i) => (
                <li key={src} className={`group relative aspect-[4/5] overflow-hidden rounded-xl border border-brown/10 bg-brown/5 ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <Image src={src} alt="" fill sizes="200px" className="object-cover" />
                  <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                    <span className="flex gap-1">
                      <button
                        type="button"
                        aria-label={p.moveUp}
                        disabled={i === 0}
                        onClick={() => moveImage(i, -1)}
                        className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={p.moveDown}
                        disabled={i === draft.images.length - 1}
                        onClick={() => moveImage(i, 1)}
                        className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <button
                      type="button"
                      aria-label={p.removePhoto}
                      onClick={() => set("images", draft.images.filter((x) => x !== src))}
                      className="rounded-full bg-black/60 p-1 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {draft.images.length < 10 && (
            <ImageUploadField
              value={null}
              defaultRatio={4 / 5}
              onChange={(img) => setDraft((d) => ({ ...d, images: [...d.images, img.url] }))}
            />
          )}
        </Card>

        <Card title={p.pricing}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{p.priceLabel}</span>
              <input
                required
                inputMode="numeric"
                value={draft.price ? String(draft.price) : ""}
                onChange={(e) => set("price", Number(digits(e.target.value)) || 0)}
                placeholder="69000"
                className={adminInput}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{p.compareAt}</span>
              <input
                inputMode="numeric"
                value={compareAt}
                onChange={(e) => setCompareAt(digits(e.target.value))}
                placeholder="85000"
                className={adminInput}
              />
              <span className="mt-1 block text-xs text-brown-soft">{p.compareAtHint}</span>
            </label>
          </div>
        </Card>

        <Card
          title={p.variants}
          action={
            <button
              type="button"
              onClick={() => set("variants", [...draft.variants, { id: newVariantId(), name: "", stock: 0 }])}
              className="text-xs font-medium text-orange hover:underline"
            >
              + {p.addVariant}
            </button>
          }
        >
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_32px] gap-2 text-xs text-brown-soft">
              <span>{p.variantName}</span>
              <span>{p.stock}</span>
            </div>
            {draft.variants.map((v, i) => (
              <div key={v.id} className="grid grid-cols-[1fr_100px_32px] items-center gap-2">
                <input
                  required
                  maxLength={60}
                  value={v.name}
                  onChange={(e) => setVariant(i, { name: e.target.value })}
                  placeholder="Cream"
                  aria-label={p.variantName}
                  className={adminInput}
                />
                <input
                  required
                  inputMode="numeric"
                  value={String(v.stock)}
                  onChange={(e) => setVariant(i, { stock: Number(digits(e.target.value)) || 0 })}
                  aria-label={p.stock}
                  className={`${adminInput} tabular-nums`}
                />
                <button
                  type="button"
                  aria-label={p.removeVariant}
                  disabled={draft.variants.length === 1}
                  onClick={() => set("variants", draft.variants.filter((_, j) => j !== i))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-brown-soft hover:bg-brown/5 hover:text-red-500 disabled:opacity-30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title={p.statusLabel}>
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as Draft["status"])}
            className={adminInput}
          >
            <option value="active">{p.active}</option>
            <option value="draft">{p.draft}</option>
          </select>
          {collections.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-brown-soft">{t.admin.collections.pick}</p>
              <div className="flex flex-wrap gap-1.5">
                {collections.map((c) => {
                  const on = (draft.collectionIds ?? []).includes(c._id);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set(
                          "collectionIds",
                          on ? (draft.collectionIds ?? []).filter((x) => x !== c._id) : [...(draft.collectionIds ?? []), c._id]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        on ? "border-brown bg-brown text-cream" : "border-brown/20 text-brown hover:border-brown/50"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {product && product.status === "active" && (
            <Link href={`/narras/p/${product.slug}`} target="_blank" className="mt-3 inline-block text-xs font-medium text-orange hover:underline">
              {p.view}
            </Link>
          )}
        </Card>

        <button type="submit" disabled={saving} className={`${primaryButton} w-full py-2.5`}>
          {saving ? p.saving : p.save}
        </button>
        {product && (
          <button type="button" onClick={onDelete} className="w-full text-xs text-brown-soft hover:text-red-500">
            {p.delete}
          </button>
        )}
      </div>
    </form>
  );
}
