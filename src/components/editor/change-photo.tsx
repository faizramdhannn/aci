"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField, type UploadedImage } from "@/components/editor/image-upload-field";
import { useToast } from "@/components/ui/toast-provider";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

export function ChangePhoto({ imageId }: { imageId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useAdminDictionary();
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
      >
        {t.editor.changePhoto}
      </button>
    );
  }

  async function onUpload(image: UploadedImage) {
    setUploaded(image);
    setSaving(true);
    const res = await fetch(`/api/shoppable-images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: image.url, imageWidth: image.width, imageHeight: image.height }),
    });
    setSaving(false);

    if (!res.ok) {
      toast(t.editor.photoFailed, "error");
      return;
    }
    toast(t.editor.photoReplaced);
    setOpen(false);
    setUploaded(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-brown">{t.editor.replaceTitle}</p>
        <button onClick={() => setOpen(false)} className="text-xs text-brown-soft hover:text-brown">
          {t.common.cancel}
        </button>
      </div>
      <p className="mb-3 text-xs text-brown-soft">{t.editor.replaceNote}</p>
      <ImageUploadField value={uploaded} onChange={onUpload} />
      {saving && <p className="mt-2 text-xs text-brown-soft">{t.common.saving}</p>}
    </div>
  );
}
