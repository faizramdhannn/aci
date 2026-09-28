import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/store/ui";
import { CollectionsManager } from "@/components/admin/store/collections-manager";
import { listCollections } from "@/lib/store/collections";
import { listStoreProducts } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.collections.title };
}

export default async function CollectionsPage() {
  const [t, collections, products] = await Promise.all([getStoreDictionary(), listCollections(), listStoreProducts()]);
  const counts = Object.fromEntries(
    collections.map((c) => [c._id, products.filter((p) => (p.collectionIds ?? []).includes(c._id)).length])
  );
  return (
    <div className="max-w-2xl">
      <PageHeader title={t.admin.collections.title} />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{t.admin.collections.intro}</p>
      <CollectionsManager collections={collections} counts={counts} />
    </div>
  );
}
