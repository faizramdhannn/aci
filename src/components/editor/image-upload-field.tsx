"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import { compressImage } from "@/lib/compress-image";

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

export function ImageUploadField({
  value,
  onChange,
}: {
  value: UploadedImage | null;
  onChange: (image: UploadedImage) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  async function finishUpload(res: Response) {
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    const { width, height } = await readImageDimensions(data.url);
    onChange({ url: data.url, width, height });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      await finishUpload(await fetch("/api/uploads", { method: "POST", body: formData }));
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImportUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!importUrl.trim()) return;
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

      <form onSubmit={handleImportUrl} className="mt-3 flex gap-2">
        <input
          type="url"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          placeholder="Or paste an Instagram/TikTok post link…"
          className="w-full min-w-0 flex-1 rounded-lg border border-brown/20 bg-cream px-3 py-2 text-xs outline-none focus:border-orange"
        />
        <button
          type="submit"
          disabled={importing || !importUrl.trim()}
          className="shrink-0 rounded-lg border border-brown/20 px-3 py-2 text-xs font-medium text-brown-soft transition-colors hover:text-brown disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </form>
    </div>
  );
}
