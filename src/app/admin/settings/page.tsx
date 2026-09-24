import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-brown">Settings</h1>
      <p className="mb-6 text-sm text-brown-soft">
        Who&apos;s behind this site — shown in the homepage hero and the footer on every page.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
