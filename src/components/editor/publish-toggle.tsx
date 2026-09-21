"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishToggle({ imageId, status }: { imageId: string; status: "draft" | "published" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isPublished = status === "published";

  async function toggle() {
    setLoading(true);
    await fetch(`/api/shoppable-images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isPublished ? "draft" : "published" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${
        isPublished ? "bg-brown text-cream" : "bg-orange text-cream"
      }`}
    >
      {loading ? "…" : isPublished ? "Published · unpublish" : "Publish"}
    </button>
  );
}
