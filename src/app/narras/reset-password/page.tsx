import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/store/account/auth-card";
import { ResetPasswordForm } from "@/components/store/account/password-reset-forms";
import { getStoreDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).account.resetTitle, robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const t = (await getStoreDictionary()).account;
  return (
    <AuthCard title={t.resetTitle}>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-brown">
          {t.errors.invalid_token}{" "}
          <Link href="/narras/forgot-password" className="font-semibold hover:underline">
            {t.sendLink}
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
