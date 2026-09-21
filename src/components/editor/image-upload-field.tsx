"use client";

import { useRef, useState } from "react";

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

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      const { width, height } = await readImageDimensions(data.url);
      onChange({ url: data.url, width, height });
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setLoading(false);
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="" className="max-h-48 rounded-lg object-contain" />
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
    </div>
  );
}
