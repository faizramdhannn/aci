"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HubSettings } from "@/types/store";
import { Card, primaryButton } from "@/components/admin/store/ui";
import { ImageSetting } from "@/components/admin/store/image-setting";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

export const HUB_CARD_RATIO = 4 / 3;

export function HubSettingsForm({ initial }: { initial: HubSettings }) {
  const t = useStoreDictionary();
  const h = t.admin.hub;
  const toast = useToast();
  const router = useRouter();
  const [outfitImage, setOutfitImage] = useState(initial.outfitImage ?? "");
  const [storeImage, setStoreImage] = useState(initial.storeImage ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/hub", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitImage, storeImage }),
    });
    setSaving(false);
    if (!res.ok) {
      toast(h.failed, "error");
      return;
    }
    toast(h.saved);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={h.outfitCard}>
          <ImageSetting value={outfitImage} onChange={setOutfitImage} ratio={HUB_CARD_RATIO} clearLabel={h.remove} />
        </Card>
        <Card title={h.storeCard}>
          <ImageSetting value={storeImage} onChange={setStoreImage} ratio={HUB_CARD_RATIO} clearLabel={h.remove} />
        </Card>
      </div>
      <button type="button" onClick={save} disabled={saving} className={primaryButton}>
        {h.save}
      </button>
    </div>
  );
}
