import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader, primaryButton } from "@/components/admin/store/ui";
import { listStoreProducts } from "@/lib/store/data";
import { ProductsTable } from "@/components/admin/store/products-table";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.products.title };
}

export default async function ProductsPage() {
  const [t, products] = await Promise.all([getStoreDictionary(), listStoreProducts()]);
  const p = t.admin.products;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={p.title}
        actions={
          <Link href="/admin/store/products/new" className={primaryButton}>
            {p.add}
          </Link>
        }
      />
      <Card className="!p-0">
        {products.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{p.empty}</p>
        ) : (
          <ProductsTable products={products} />
        )}
      </Card>
    </div>
  );
}
