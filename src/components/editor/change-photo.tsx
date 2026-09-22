"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField, type UploadedImage } from "@/components/editor/image-upload-field";

export function ChangePhoto({ imageId }: { imageId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
      >
        Change photo
      </button>
    );
  }

  async function onUpload(image: UploadedImage) {
    setUploaded(image);
    setSaving(true);
    await fetch(`/api/shoppable-images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: image.url, imageWidth: image.width, imageHeight: image.height }),
    });
    setSaving(false);
    setOpen(false);
    setUploaded(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-brown">Replace this photo</p>
        <button onClick={() => setOpen(false)} className="text-xs text-brown-soft hover:text-brown">
          Cancel
        </button>
      </div>
      <p className="mb-3 text-xs text-brown-soft">
        Existing hotspot positions stay the same (they&apos;re normalized), but re-check them against the new photo
        after replacing it.
      </p>
      <ImageUploadField value={uploaded} onChange={onUpload} />
      {saving && <p className="mt-2 text-xs text-brown-soft">Saving…</p>}
    </div>
  );
}
