"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

export function ReviewForm({ productId, initial }: { productId: string; initial?: { rating: number; body: string } }) {
  const t = useStoreDictionary().reviews;
  const toast = useToast();
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError(t.errors.invalid);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/store/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, body }),
    });
    setBusy(false);
    if (!res.ok) {
      const code = (await res.json().catch(() => ({}))).error as keyof typeof t.errors;
      setError(t.errors[code] ?? t.errors.generic);
      return;
    }
    toast(t.saved);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-brown/15 p-4">
      <p className="text-sm font-semibold text-brown">{initial ? t.edit : t.write}</p>
      <div className="flex gap-1" role="radiogroup" aria-label={t.rating} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => setRating(i)}
            className="p-0.5"
          >
            <Star className={`h-7 w-7 ${(hover || rating) >= i ? "fill-yellow text-yellow" : "text-brown/30"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder={t.body}
        aria-label={t.body}
        className="w-full rounded-xl border border-brown/20 bg-surface px-3.5 py-2.5 text-sm text-brown outline-none focus:border-brown"
      />
      {error && <p className="text-sm text-orange">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-brown px-5 py-2 text-sm font-semibold text-cream hover:opacity-90 disabled:opacity-50"
      >
        {t.submit}
      </button>
    </form>
  );
}
