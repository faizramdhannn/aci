"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { HeroBanner, StoreSettings } from "@/types/store";
import { Card, adminInput, primaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { ImageSetting } from "@/components/admin/store/image-setting";
import { format } from "@/lib/i18n/dictionaries";

export function StoreSettingsForm({ initial }: { initial: StoreSettings }) {
  const t = useStoreDictionary();
  const s = t.admin.settings;
  const toast = useToast();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const banners = values.heroBanners ?? [];
  const setBanners = (next: HeroBanner[]) => setValues((v) => ({ ...v, heroBanners: next }));
  const updateBanner = (i: number, patch: Partial<HeroBanner>) =>
    setBanners(banners.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const moveBanner = (i: number, dir: -1 | 1) => {
    const next = [...banners];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setBanners(next);
  };

  const field = (key: "storeName" | "tagline" | "whatsappNumber" | "paymentInfo" | "instagramUrl") => ({
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
      body: JSON.stringify({
        ...values,
        // Slides without a photo yet aren't saved.
        heroBanners: banners.filter((b) => b.image),
        heroImage: undefined,
        heroTitle: undefined,
        heroSubtitle: undefined,
      }),
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
      <Card
        title={s.hero}
        action={
          (values.heroBanners?.length ?? 0) < 8 && (
            <button
              type="button"
              onClick={() => setBanners([...banners, { id: `b-${Date.now().toString(36)}`, image: "" }])}
              className="text-xs font-medium text-orange hover:underline"
            >
              + {s.addSlide}
            </button>
          )
        }
      >
        <p className="-mt-2 mb-4 text-xs text-brown-soft">{s.heroHint}</p>
        <div className="space-y-4">
          {banners.map((banner, i) => (
            <div key={banner.id} className="rounded-xl border border-brown/10 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-brown">{format(s.slide, { n: i + 1 })}</span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={s.moveUp}
                    disabled={i === 0}
                    onClick={() => moveBanner(i, -1)}
                    className="rounded-full p-1 text-brown-soft hover:bg-brown/5 disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={s.moveDown}
                    disabled={i === banners.length - 1}
                    onClick={() => moveBanner(i, 1)}
                    className="rounded-full p-1 text-brown-soft hover:bg-brown/5 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanners(banners.filter((b) => b.id !== banner.id))}
                    className="ml-1 text-xs text-brown-soft hover:text-red-500"
                  >
                    {s.removeSlide}
                  </button>
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-[240px_1fr]">
                <ImageSetting
                  value={banner.image}
                  onChange={(url) => updateBanner(i, { image: url })}
                  ratio={16 / 9}
                  clearLabel={s.removeImage}
                />
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-brown-soft">{s.heroTitle}</span>
                    <input
                      maxLength={80}
                      placeholder={s.heroTitlePlaceholder}
                      value={banner.title ?? ""}
                      onChange={(e) => updateBanner(i, { title: e.target.value })}
                      className={adminInput}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-brown-soft">{s.heroSubtitle}</span>
                    <input
                      maxLength={200}
                      value={banner.subtitle ?? ""}
                      onChange={(e) => updateBanner(i, { subtitle: e.target.value })}
                      className={adminInput}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-brown-soft">{s.heroLink}</span>
                    <input
                      maxLength={500}
                      placeholder={s.heroLinkPlaceholder}
                      value={banner.href ?? ""}
                      onChange={(e) => updateBanner(i, { href: e.target.value })}
                      className={adminInput}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <button type="submit" disabled={saving} className={primaryButton}>
        {s.save}
      </button>
    </form>
  );
}
