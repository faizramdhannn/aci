"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageCropper } from "@/components/editor/image-cropper";
import { useToast } from "@/components/ui/toast-provider";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";
import { format } from "@/lib/i18n/dictionaries";
import type { CropRect } from "@/lib/crop";

/** Re-crop an existing look to a new aspect ratio; hotspots and annotations are moved to match on the server. */
export function ReframePhoto({
  imageId,
  imageUrl,
  imageWidth,
  imageHeight,
}: {
  imageId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useAdminDictionary();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
      >
        {t.editor.crop}
      </button>
    );
  }

  async function onConfirm(crop: CropRect) {
    setSaving(true);
    const res = await fetch(`/api/shoppable-images/${imageId}/crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(t.editor.cropFailed, "error");
      return;
    }
    toast(data.outside > 0 ? format(t.editor.cropDoneOutside, { n: data.outside }) : t.editor.cropDone);
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.editor.crop}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-cream">
        <ImageCropper
          src={imageUrl}
          naturalWidth={imageWidth}
          naturalHeight={imageHeight}
          initialRatio={null}
          confirmLabel={t.editor.cropApply}
          busy={saving}
          onCancel={() => setOpen(false)}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
}
