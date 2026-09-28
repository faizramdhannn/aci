"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/types/store";
import { Card, adminInput, primaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { format } from "@/lib/i18n/dictionaries";

export function StoreSettingsForm({ initial }: { initial: StoreSettings }) {
  const t = useStoreDictionary();
  const s = t.admin.settings;
  const toast = useToast();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const field = (key: keyof StoreSettings) => ({
    value: values[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/store/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(format(s.failed, { field: data.field ?? "" }), "error");
      return;
    }
    toast(s.saved);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{s.storeName}</span>
            <input required maxLength={60} {...field("storeName")} className={adminInput} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{s.tagline}</span>
            <input maxLength={160} {...field("tagline")} className={adminInput} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{s.whatsapp}</span>
            <input type="tel" inputMode="tel" placeholder="6281234567890" {...field("whatsappNumber")} className={adminInput} />
            <span className="mt-1 block text-xs text-brown-soft">{s.whatsappHint}</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{s.paymentInfo}</span>
            <textarea rows={4} maxLength={1000} placeholder={s.paymentPlaceholder} {...field("paymentInfo")} className={adminInput} />
            <span className="mt-1 block text-xs text-brown-soft">{s.paymentHint}</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brown-soft">{s.instagram}</span>
            <input type="url" placeholder="https://instagram.com/…" {...field("instagramUrl")} className={adminInput} />
          </label>
        </div>
      </Card>
      <button type="submit" disabled={saving} className={primaryButton}>
        {s.save}
      </button>
    </form>
  );
}
