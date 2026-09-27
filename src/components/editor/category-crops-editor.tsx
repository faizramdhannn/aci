"use client";

import { useState } from "react";
import type { Category, Hotspot, ShoppableImage } from "@/types";
import { cropImageStyle, remapPoint, SHOP_CROP_RATIO, shopCropFor, type CropRect } from "@/lib/crop";
import { ImageCropper } from "@/components/editor/image-cropper";
import { CategoryIcon } from "@/components/admin/category-icons";
import { LinkMarker } from "@/components/storefront/link-marker";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";
import { useToast } from "@/components/ui/toast-provider";

/**
 * Previews the shop card each product category of this look gets, and lets
 * the admin re-frame any of them (4:5, locked) or reset it to auto-framing.
 * Uses the editor's live hotspots, so tagging a product with a new category
 * shows its card here straight away.
 */
export function CategoryCropsEditor({
  image,
  hotspots,
  categories,
}: {
  image: ShoppableImage;
  hotspots: Hotspot[];
  categories: Category[];
}) {
  const t = useAdminDictionary();
  const toast = useToast();
  const [crops, setCrops] = useState<Record<string, CropRect>>(image.categoryCrops ?? {});
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const current = { ...image, categoryCrops: crops };
  const used = categories.filter((c) =>
    hotspots.some((h) => h.isActive && (h.categoryIds ?? []).includes(c._id))
  );

  async function save(next: Record<string, CropRect>) {
    setSaving(true);
    const res = await fetch(`/api/shoppable-images/${image._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryCrops: next }),
    });
    setSaving(false);
    if (!res.ok) {
      toast(t.editor.shopFailed, "error");
      return false;
    }
    setCrops(next);
    toast(t.editor.shopSaved);
    return true;
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-brown">{t.editor.shopPhotos}</h2>
      <p className="mb-3 max-w-xl text-xs text-brown-soft">{t.editor.shopPhotosHint}</p>

      {used.length === 0 ? (
        <p className="text-xs text-brown-soft">{t.editor.shopPhotosEmpty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {used.map((category) => {
            const crop = shopCropFor(current, category._id, hotspots);
            const custom = Boolean(crops[category._id]);
            const own = hotspots.filter((h) => h.isActive && (h.categoryIds ?? []).includes(category._id));
            return (
              <div key={category._id} className="rounded-xl border border-brown/10 bg-surface/70 p-2">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-brown/5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, exact CSS crop of the original */}
                  <img src={image.imageUrl} alt="" className="absolute max-w-none object-cover" style={cropImageStyle(crop)} />
                  {own.map((h) => {
                    const p = remapPoint(h.x, h.y, crop);
                    if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return null;
                    return (
                      <span
                        key={h._id}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                      >
                        <LinkMarker color={h.color} size={16} />
                      </span>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brown">
                  <CategoryIcon name={category.icon} className="h-3.5 w-3.5 text-orange" />
                  <span className="truncate">{category.name}</span>
                </div>
                <p className="text-[11px] text-brown-soft">{custom ? t.editor.shopCustom : t.editor.shopAutoFramed}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(category)}
                    className="rounded-full border border-brown/20 px-3 py-1 text-xs text-brown-soft hover:text-brown"
                  >
                    {t.editor.shopAdjust}
                  </button>
                  {custom && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        const next = { ...crops };
                        delete next[category._id];
                        save(next);
                      }}
                      className="rounded-full px-2 py-1 text-xs text-brown-soft hover:text-orange disabled:opacity-50"
                    >
                      {t.editor.shopAuto}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${t.editor.shopPhotos}: ${editing.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
        >
          <div className="w-full max-w-xl rounded-2xl bg-cream">
            <ImageCropper
              src={image.imageUrl}
              naturalWidth={image.imageWidth}
              naturalHeight={image.imageHeight}
              initialRatio={SHOP_CROP_RATIO}
              initialCrop={shopCropFor(current, editing._id, hotspots)}
              lockRatio
              confirmLabel={t.editor.shopSave}
              busy={saving}
              onCancel={() => setEditing(null)}
              onConfirm={async (crop) => {
                if (await save({ ...crops, [editing._id]: crop })) setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
