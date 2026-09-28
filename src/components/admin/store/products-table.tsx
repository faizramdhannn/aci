"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Combine } from "lucide-react";
import type { StoreProduct } from "@/types/store";
import { ProductStatusBadge, primaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { formatRupiah } from "@/lib/store/money";
import { priceRange } from "@/lib/store/catalog";
import { commonTitle } from "@/lib/store/merge-plan";
import { format } from "@/lib/i18n/dictionaries";

/** Products list with row selection, to merge several products into one with variants. */
export function ProductsTable({ products }: { products: StoreProduct[] }) {
  const t = useStoreDictionary().admin.products;
  const toast = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function merge() {
    const chosen = selected.map((id) => products.find((p) => p._id === id)!).filter(Boolean);
    const suggested = commonTitle(chosen.map((p) => p.title)) || chosen[0].title;
    const title = window.prompt(format(t.mergePrompt, { n: chosen.length }), suggested);
    if (title === null) return;
    setBusy(true);
    const res = await fetch("/api/store/products/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, title }),
    });
    setBusy(false);
    if (!res.ok) {
      toast(t.mergeFailed, "error");
      return;
    }
    const { id } = await res.json();
    toast(t.merged);
    router.push(`/admin/store/products/${id}`);
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brown/10 bg-brown/5 px-4 py-2.5 text-sm">
          <span className="text-brown">{format(t.selected, { n: selected.length })}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelected([])} className="text-xs text-brown-soft hover:text-brown">
              {t.clearSelection}
            </button>
            <button type="button" disabled={busy || selected.length < 2} onClick={merge} className={`${primaryButton} flex items-center gap-1.5`}>
              <Combine className="h-4 w-4" />
              {t.merge}
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="text-left text-xs text-brown-soft">
            <tr className="border-b border-brown/10">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label={t.selectAll}
                  checked={selected.length === products.length}
                  onChange={(e) => setSelected(e.target.checked ? products.map((p) => p._id) : [])}
                  className="accent-[var(--color-brown)]"
                />
              </th>
              <th className="px-2 py-2.5 font-medium">{t.product}</th>
              <th className="px-4 py-2.5 font-medium">{t.status}</th>
              <th className="px-4 py-2.5 font-medium">{t.inventory}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t.price}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown/10">
            {products.map((product) => {
              const stock = product.variants.reduce((s, v) => s + v.stock, 0);
              const range = priceRange(product);
              const cover = product.images[0] ?? product.variants.find((v) => v.image)?.image;
              return (
                <tr key={product._id} className={`hover:bg-brown/5 ${selected.includes(product._id) ? "bg-brown/5" : ""}`}>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={product.title}
                      checked={selected.includes(product._id)}
                      onChange={() => toggle(product._id)}
                      className="accent-[var(--color-brown)]"
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link href={`/admin/store/products/${product._id}`} className="flex items-center gap-3">
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-brown/10 bg-brown/5">
                        {cover && <Image src={cover} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <span className="font-medium text-brown hover:underline">{product.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <ProductStatusBadge active={product.status === "active"} label={product.status === "active" ? t.active : t.draft} />
                  </td>
                  <td className={`px-4 py-2.5 ${stock === 0 ? "text-red-500" : "text-brown-soft"}`}>
                    {format(t.inStock, { n: stock })}
                    {product.variants.length > 1 && ` · ${format(t.variantsCount, { n: product.variants.length })}`}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-brown">
                    {range.min === range.max ? formatRupiah(range.min) : `${formatRupiah(range.min)} – ${formatRupiah(range.max)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
