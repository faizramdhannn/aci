import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/store/ui";
import { StoreSettingsForm } from "@/components/admin/store/store-settings-form";
import { getStoreSettings } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.settings.title };
}

export default async function StoreSettingsPage() {
  const [t, settings] = await Promise.all([getStoreDictionary(), getStoreSettings()]);
  return (
    <div className="max-w-2xl">
      <PageHeader title={t.admin.settings.title} />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{t.admin.settings.intro}</p>
      <StoreSettingsForm initial={settings} />
    </div>
  );
}
