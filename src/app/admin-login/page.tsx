import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";
import { format } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).login.submit };
}

export default async function LoginPage() {
  const [t, settings] = await Promise.all([getAdminDictionary(), getSiteSettings()]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <LoginForm studio={format(t.studio, { site: settings.siteName })} />
      </Suspense>
    </main>
  );
}
