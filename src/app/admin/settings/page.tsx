import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).settings.title };
}
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, t] = await Promise.all([getSiteSettings(), getAdminDictionary()]);
  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-brown">{t.settings.title}</h1>
      <p className="mb-6 text-sm text-brown-soft">
        {t.settings.intro}
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
