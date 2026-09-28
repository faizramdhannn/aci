import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Card, PageHeader, ProductStatusBadge, primaryButton } from "@/components/admin/store/ui";
import { listStoreProducts, totalStock } from "@/lib/store/data";
import { formatRupiah } from "@/lib/store/money";
import { getStoreDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-brown-soft">
                <tr className="border-b border-brown/10">
                  <th className="px-4 py-2.5 font-medium">{p.product}</th>
                  <th className="px-4 py-2.5 font-medium">{p.status}</th>
                  <th className="px-4 py-2.5 font-medium">{p.inventory}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{p.price}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10">
                {products.map((product) => {
                  const stock = totalStock(product);
                  return (
                    <tr key={product._id} className="relative hover:bg-brown/5">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/store/products/${product._id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-brown/10 bg-brown/5">
                            {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                          </span>
                          <span className="font-medium text-brown">{product.title}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <ProductStatusBadge active={product.status === "active"} label={product.status === "active" ? p.active : p.draft} />
                      </td>
                      <td className={`px-4 py-2.5 ${stock === 0 ? "text-red-500" : "text-brown-soft"}`}>
                        {format(p.inStock, { n: stock })}
                        {product.variants.length > 1 && ` · ${format(p.variantsCount, { n: product.variants.length })}`}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-brown">{formatRupiah(product.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
