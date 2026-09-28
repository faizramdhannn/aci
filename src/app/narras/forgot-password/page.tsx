import type { Metadata } from "next";
import { AuthCard } from "@/components/store/account/auth-card";
import { ForgotPasswordForm } from "@/components/store/account/password-reset-forms";
import { getStoreDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).account.forgotTitle, robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const t = (await getStoreDictionary()).account;
  return (
    <AuthCard title={t.forgotTitle} intro={t.forgotIntro}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
