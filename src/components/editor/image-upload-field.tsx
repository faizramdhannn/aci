"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import { prepareImage } from "@/lib/compress-image";
import { ImageCropper } from "@/components/editor/image-cropper";
import type { CropRect } from "@/lib/crop";

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

interface PendingFile {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export function ImageUploadField({
  value,
  onChange,
  defaultRatio = 4 / 5,
}: {
  value: UploadedImage | null;
  onChange: (image: UploadedImage) => void;
  /** Aspect ratio the crop step starts on (width/height); null = original. */
  defaultRatio?: number | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<PendingFile | null>(null);

  async function finishUpload(res: Response) {
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    const { width, height } = await readImageDimensions(data.url);
    onChange({ url: data.url, width, height });
  }

  // Picking a file opens the crop step first; the upload happens on confirm.
  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.type === "image/gif") {
      await upload(file);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    try {
      const { width, height } = await readImageDimensions(previewUrl);
      setPending({ file, previewUrl, width, height });
    } catch {
      URL.revokeObjectURL(previewUrl);
      setError("That file doesn't look like an image.");
    }
  }

  function closeCropper() {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload(file: File, crop?: CropRect) {
    setLoading(true);
    try {
      const prepared = await prepareImage(file, crop);
      const formData = new FormData();
      formData.append("file", prepared);
      await finishUpload(await fetch("/api/uploads", { method: "POST", body: formData }));
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCrop(crop: CropRect) {
    if (!pending) return;
    const { file } = pending;
    await upload(file, crop);
    closeCropper();
  }

  // Not a <form>: this field is rendered inside other forms (e.g. "Upload a
  // look", Settings), and nested forms are invalid HTML.
  async function handleImportUrl() {
    if (!importUrl.trim() || importing) return;
    setError(null);
    setImporting(true);
    try {
      await finishUpload(
        await fetch("/api/uploads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: importUrl.trim() }),
        })
      );
      setImportUrl("");
    } catch {
      setError("Import failed. Check your connection and try again.");
    } finally {
      setImporting(false);
    }
  }

  if (pending) {
    return (
      <ImageCropper
        src={pending.previewUrl}
        naturalWidth={pending.width}
        naturalHeight={pending.height}
        initialRatio={defaultRatio}
        confirmLabel="Crop and upload"
        busy={loading}
        onCancel={closeCropper}
        onConfirm={confirmCrop}
      />
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-orange bg-orange/5" : "border-brown/25 hover:border-brown/40"
        }`}
      >
        {value ? (
          <NextImage
            src={value.url}
            alt=""
            width={value.width}
            height={value.height}
            className="max-h-48 w-auto rounded-lg object-contain"
          />
        ) : (
          <>
            <span className="text-sm font-medium text-brown">
              {loading ? "Uploading…" : "Drop a photo here, or click to choose one"}
            </span>
            <span className="text-xs text-brown-soft">JPEG, PNG, WEBP, or GIF — up to 8MB</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs font-medium text-orange hover:underline"
        >
          Choose a different photo
        </button>
      )}
      {error && <p className="mt-2 text-xs text-orange">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          type="url"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleImportUrl();
            }
          }}
          placeholder="Or paste an Instagram/TikTok post link…"
          className="w-full min-w-0 flex-1 rounded-lg border border-brown/20 bg-cream px-3 py-2 text-xs outline-none focus:border-orange"
        />
        <button
          type="button"
          onClick={handleImportUrl}
          disabled={importing || !importUrl.trim()}
          className="shrink-0 rounded-lg border border-brown/20 px-3 py-2 text-xs font-medium text-brown-soft transition-colors hover:text-brown disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </div>
    </div>
  );
}
