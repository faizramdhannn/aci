"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ShoppableImage } from "@/types";
import { useToast } from "@/components/ui/toast-provider";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";
import { format } from "@/lib/i18n/dictionaries";

export function ShoppableImagesTable({ initialImages }: { initialImages: ShoppableImage[] }) {
  const router = useRouter();
  const toast = useToast();
  const t = useAdminDictionary();
  const [images, setImages] = useState(initialImages);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const allSelected = images.length > 0 && selected.size === images.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(images.map((i) => i._id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAction(action: "publish" | "draft" | "delete") {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(format(t.looks.confirmDeleteMany, { n: selected.size }))) return;

    setBusy(true);
    const ids = Array.from(selected);
    const res = await fetch("/api/shoppable-images/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    setBusy(false);

    if (!res.ok) {
      toast(t.looks.bulkFailed, "error");
      return;
    }

    if (action === "delete") {
      setImages((prev) => prev.filter((i) => !selected.has(i._id)));
      toast(format(t.looks.deletedMany, { n: ids.length }));
    } else {
      const status = action === "publish" ? "published" : "draft";
      setImages((prev) => prev.map((i) => (selected.has(i._id) ? { ...i, status } : i)));
      toast(format(action === "publish" ? t.looks.publishedMany : t.looks.draftedMany, { n: ids.length }));
    }
    setSelected(new Set());
    router.refresh();
  }

  async function duplicate(id: string) {
    setBusy(true);
    const res = await fetch(`/api/shoppable-images/${id}/duplicate`, { method: "POST" });
    setBusy(false);

    if (!res.ok) {
      toast(t.looks.duplicateFailed, "error");
      return;
    }
    const copy: ShoppableImage = await res.json();
    setImages((prev) => [copy, ...prev]);
    toast(format(t.looks.duplicated, { title: copy.title }));
    router.refresh();
  }

  async function deleteOne(id: string, title: string) {
    if (!confirm(format(t.looks.confirmDeleteOne, { title }))) return;
    setBusy(true);
    const res = await fetch(`/api/shoppable-images/${id}`, { method: "DELETE" });
    setBusy(false);

    if (!res.ok) {
      toast(t.looks.deleteFailed, "error");
      return;
    }
    setImages((prev) => prev.filter((i) => i._id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast(t.looks.deleted);
    router.refresh();
  }

  if (images.length === 0) {
    return (
      <p className="text-brown-soft">{t.overview.empty}</p>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-brown/10 bg-surface/70 px-4 py-2 text-sm">
          <span className="text-brown-soft">{format(t.looks.selected, { n: selected.size })}</span>
          <button disabled={busy} onClick={() => bulkAction("publish")} className="font-medium text-orange hover:underline disabled:opacity-50">
            {t.looks.publish}
          </button>
          <button disabled={busy} onClick={() => bulkAction("draft")} className="font-medium text-brown hover:underline disabled:opacity-50">
            {t.looks.moveToDraft}
          </button>
          <button disabled={busy} onClick={() => bulkAction("delete")} className="font-medium text-orange hover:underline disabled:opacity-50">
            {t.common.delete}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brown/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-brown/5 text-xs uppercase tracking-wide text-brown-soft">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t.looks.selectAll} />
              </th>
              <th className="px-4 py-3">{t.looks.colTitle}</th>
              <th className="px-4 py-3">{t.looks.colStatus}</th>
              <th className="px-4 py-3">{t.looks.colUpdated}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {images.map((image) => (
              <tr key={image._id} className="border-t border-brown/10">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(image._id)}
                    onChange={() => toggleOne(image._id)}
                    aria-label={format(t.looks.select, { title: image.title })}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-brown">{image.title}</td>
                <td className="px-4 py-3 text-brown-soft">{image.status === "published" ? t.common.statusPublished : t.common.statusDraft}</td>
                <td className="px-4 py-3 text-brown-soft">
                  {new Date(image.updatedAt).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/shoppable-images/${image._id}/edit`} className="text-orange hover:underline">
                      {t.common.edit}
                    </Link>
                    <button disabled={busy} onClick={() => duplicate(image._id)} className="text-brown-soft hover:text-brown disabled:opacity-50">
                      {t.common.duplicate}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => deleteOne(image._id, image.title)}
                      className="text-brown-soft hover:text-orange disabled:opacity-50"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
