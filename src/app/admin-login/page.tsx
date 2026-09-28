import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isAdminSession, isGoogleLoginEnabled } from "@/lib/auth";
import { getAdminDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";
import { format } from "@/lib/i18n/dictionaries";
import { safeCallback } from "@/lib/store/safe-callback";
import { Logo } from "@/components/navigation/logo";
import { CustomerLoginForm } from "@/components/store/account/login-form";
import { LogoutButton } from "@/components/store/account/account-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).login.submit, robots: { index: false } };
}

/** Admin sign-in uses the same accounts as the store; only superadmin emails get through. */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl, "/admin");
  const [t, settings, session] = await Promise.all([getAdminDictionary(), getSiteSettings(), auth()]);
  if (isAdminSession(session)) redirect(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm rounded-2xl border border-brown/10 bg-surface/70 p-6">
        <p className="mb-1 flex items-center gap-2 font-display text-2xl text-orange">
          <Logo size={28} />
          {format(t.studio, { site: settings.siteName })}
        </p>
        <h1 className="mb-6 text-lg font-semibold text-brown">{t.login.title}</h1>
        {session ? (
          <div className="space-y-4 text-sm">
            <p className="text-brown">{format(t.login.notAdmin, { email: session.user?.email ?? "" })}</p>
            <LogoutButton label={t.login.switchAccount} />
          </div>
        ) : (
          <CustomerLoginForm callbackUrl={callbackUrl} googleEnabled={isGoogleLoginEnabled} />
        )}
      </div>
    </main>
  );
}
