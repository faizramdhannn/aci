import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/store/ui";
import { ProductForm } from "@/components/admin/store/product-form";
import { getStoreDictionary } from "@/lib/i18n/server";
import { listCollections } from "@/lib/store/collections";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.products.newTitle };
}

export default async function NewProductPage() {
  const [t, collections] = await Promise.all([getStoreDictionary(), listCollections()]);
  return (
    <div className="max-w-5xl">
      <PageHeader back={{ href: "/admin/store/products", label: t.admin.products.back }} title={t.admin.products.newTitle} />
      <ProductForm collections={collections} />
    </div>
  );
}
