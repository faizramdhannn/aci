import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, secondaryButton } from "@/components/admin/store/ui";
import { HubSettingsForm } from "@/components/admin/store/hub-settings-form";
import { getHubSettings } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.hub.title };
}

export default async function HubAdminPage() {
  const [t, hub] = await Promise.all([getStoreDictionary(), getHubSettings()]);
  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t.admin.hub.title}
        actions={
          <Link href="/" target="_blank" className={secondaryButton}>
            ↗
          </Link>
        }
      />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{t.admin.hub.intro}</p>
      <HubSettingsForm initial={hub} />
    </div>
  );
}
