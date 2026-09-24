"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

export function FeaturedToggle({ imageId, featured }: { imageId: string; featured: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/shoppable-images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });
    setLoading(false);
    if (!res.ok) {
      toast("Couldn't update featured status.", "error");
      return;
    }
    toast(featured ? "Removed from the homepage carousel." : "Featured in the homepage carousel.");
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={featured}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        featured ? "border-yellow bg-yellow/20 text-brown" : "border-brown/20 text-brown-soft hover:text-brown"
      }`}
    >
      {featured ? "★ Featured" : "☆ Feature on homepage"}
    </button>
  );
}
