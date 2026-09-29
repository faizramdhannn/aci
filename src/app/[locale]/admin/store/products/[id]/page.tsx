import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/store/ui";
import { ProductForm } from "@/components/admin/store/product-form";
import { getStoreProductById } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";
import { listCollections } from "@/lib/store/collections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = await getStoreProductById((await params).id);
  return { title: product?.title ?? "Product" };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, t, collections] = await Promise.all([getStoreProductById(id), getStoreDictionary(), listCollections()]);
  if (!product) notFound();
  return (
    <div className="max-w-5xl">
      <PageHeader back={{ href: "/admin/store/products", label: t.admin.products.back }} title={product.title} />
      {/* key: re-mount the form with fresh data after a save + refresh */}
      <ProductForm key={product.updatedAt} product={product} collections={collections} />
    </div>
  );
}
