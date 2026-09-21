"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const sampleImages = [
  { label: "Cream on cream (sample)", value: "/seed/look-cream-hijab.svg" },
  { label: "Golden hour (sample)", value: "/seed/look-golden-hour.svg" },
];

export default function NewShoppableImagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState(sampleImages[0].value);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/shoppable-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, imageUrl, description }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Couldn't save this look. Try again.");
      return;
    }

    const image = await res.json();
    router.push(`/admin/shoppable-images/${image._id}/edit`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-brown">Upload a look</h1>
      <p className="mb-6 text-sm text-brown-soft">
        For this local build, pick one of the sample photos or paste an image URL — a real file
        uploader needs Vercel Blob configured (see README).
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-brown-soft">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cream on cream"
            className="w-full rounded-lg border border-brown/20 bg-white/40 px-3 py-2 outline-none focus:border-orange"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-brown-soft">Photo</span>
          <select
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg border border-brown/20 bg-white/40 px-3 py-2 outline-none focus:border-orange"
          >
            {sampleImages.map((img) => (
              <option key={img.value} value={img.value}>
                {img.label}
              </option>
            ))}
          </select>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="or paste an image URL"
            className="mt-2 w-full rounded-lg border border-brown/20 bg-white/40 px-3 py-2 text-xs outline-none focus:border-orange"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-brown-soft">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-brown/20 bg-white/40 px-3 py-2 outline-none focus:border-orange"
          />
        </label>

        {error && <p className="text-sm text-orange">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Continue to editor"}
        </button>
      </form>
    </div>
  );
}
