"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageCropper } from "@/components/editor/image-cropper";
import { useToast } from "@/components/ui/toast-provider";
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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
      >
        Crop / ratio
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
      toast(data.error ?? "Couldn't crop this photo.", "error");
      return;
    }
    toast(
      data.outside > 0
        ? `Cropped. ${data.outside} marker(s) fell outside the new frame and were moved to its edge — check them.`
        : "Cropped. Markers moved with the photo.",
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-cream">
        <ImageCropper
          src={imageUrl}
          naturalWidth={imageWidth}
          naturalHeight={imageHeight}
          initialRatio={null}
          confirmLabel="Apply crop"
          busy={saving}
          onCancel={() => setOpen(false)}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
}
