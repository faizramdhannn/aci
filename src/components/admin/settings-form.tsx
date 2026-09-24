"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/types";
import { ImageUploadField, type UploadedImage } from "@/components/editor/image-upload-field";
import { useToast } from "@/components/ui/toast-provider";

const inputClass =
  "w-full rounded-lg border border-brown/20 bg-surface/80 px-3 py-2 text-sm text-brown outline-none focus:border-orange";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [avatar, setAvatar] = useState<UploadedImage | null>(
    initial.avatarUrl ? { url: initial.avatarUrl, width: 400, height: 400 } : null
  );
  const [saving, setSaving] = useState(false);

  function field<K extends keyof SiteSettings>(key: K) {
    return {
      value: (values[key] as string | undefined) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, avatarUrl: avatar?.url ?? "" }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "Couldn't save settings.", "error");
      return;
    }
    toast("Settings saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">Site name</span>
        <input required {...field("siteName")} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">Your name</span>
        <input {...field("creatorName")} placeholder="e.g. Aci Rahma" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">Tagline</span>
        <input {...field("tagline")} placeholder="Everyday modest outfits, every piece linked." className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">About (footer)</span>
        <textarea {...field("about")} rows={3} className={inputClass} />
      </label>
      <div className="text-sm">
        <span className="mb-1 block text-brown-soft">Profile photo</span>
        <ImageUploadField value={avatar} onChange={setAvatar} />
        {avatar && (
          <button type="button" onClick={() => setAvatar(null)} className="mt-1 text-xs text-brown-soft hover:text-orange">
            Remove photo
          </button>
        )}
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">Instagram URL</span>
        <input type="url" {...field("instagramUrl")} placeholder="https://instagram.com/…" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">TikTok URL</span>
        <input type="url" {...field("tiktokUrl")} placeholder="https://tiktok.com/@…" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-brown-soft">Contact email</span>
        <input type="email" {...field("email")} className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-orange px-5 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
