import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/store/account/auth-card";
import { CustomerLoginForm } from "@/components/store/account/login-form";
import { customerId, isGoogleLoginEnabled } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";
import { safeCallback } from "@/lib/store/safe-callback";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).account.loginTitle, robots: { index: false } };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl);
  const id = await customerId();
  if (id && (await getCustomerById(id))) redirect(callbackUrl);
  const t = (await getStoreDictionary()).account;
  return (
    <AuthCard title={t.loginTitle} intro={t.loginIntro}>
      <CustomerLoginForm callbackUrl={callbackUrl} googleEnabled={isGoogleLoginEnabled} />
    </AuthCard>
  );
}
