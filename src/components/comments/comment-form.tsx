"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentTarget } from "@/types/store";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

const inputClass =
  "w-full rounded-xl border border-brown/20 bg-surface px-3.5 py-2.5 text-sm text-brown outline-none focus:border-brown";

export function CommentForm({ target, targetId }: { target: CommentTarget; targetId: string }) {
  const t = useStoreDictionary().comments;
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const website = String(new FormData(e.currentTarget).get("website") ?? "");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, targetId, name, body, website }),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => ({}))).error as keyof typeof t.errors;
        setError(t.errors[code] ?? t.errors.generic);
        return;
      }
      setBody("");
      toast(t.posted);
      router.refresh();
    } catch {
      setError(t.errors.generic);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={40}
        placeholder={t.name}
        aria-label={t.name}
        autoComplete="nickname"
        className={inputClass}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={2}
        maxLength={500}
        rows={3}
        placeholder={t.body}
        aria-label={t.body}
        className={inputClass}
      />
      {/* Honeypot for bots: hidden from people and screen readers. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="text-sm text-orange">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="rounded-full bg-brown px-5 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sending ? t.sending : t.send}
      </button>
    </form>
  );
}
