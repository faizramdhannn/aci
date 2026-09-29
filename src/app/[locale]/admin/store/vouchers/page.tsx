import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/store/ui";
import { VouchersManager } from "@/components/admin/store/vouchers-manager";
import { listVouchers } from "@/lib/store/vouchers";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.vouchers.title };
}

export default async function VouchersPage() {
  const [t, vouchers] = await Promise.all([getStoreDictionary(), listVouchers()]);
  return (
    <div className="max-w-3xl">
      <PageHeader title={t.admin.vouchers.title} />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{t.admin.vouchers.intro}</p>
      <VouchersManager vouchers={vouchers} />
    </div>
  );
}
