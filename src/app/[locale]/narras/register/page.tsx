import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/store/account/auth-card";
import { RegisterForm } from "@/components/store/account/register-form";
import { customerId, isGoogleLoginEnabled } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";
import { safeCallback } from "@/lib/store/safe-callback";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).account.registerTitle, robots: { index: false } };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl);
  const id = await customerId();
  if (id && (await getCustomerById(id))) redirect(callbackUrl);
  const t = (await getStoreDictionary()).account;
  return (
    <AuthCard title={t.registerTitle} intro={t.registerIntro}>
      <RegisterForm callbackUrl={callbackUrl} googleEnabled={isGoogleLoginEnabled} />
    </AuthCard>
  );
}
