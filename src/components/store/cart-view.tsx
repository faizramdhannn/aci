"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import type { CustomerAddress, StoreVariant } from "@/types/store";
import { useCartContext, type CartLine } from "@/lib/store/cart";
import { formatRupiah } from "@/lib/store/money";
import { VoucherField, type AppliedVoucher } from "@/components/store/voucher-field";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";

interface CartProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  image: string | null;
  variants: StoreVariant[];
}

const inputClass =
  "w-full rounded-xl border border-brown/20 bg-surface px-3.5 py-2.5 text-sm text-brown outline-none focus:border-brown";

type ErrorCode = keyof ReturnType<typeof useStoreDictionary>["store"]["errors"];

export function CartView({
  addresses,
  defaultAddressId,
  prefill,
}: {
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  /** The account's name and phone, to start a new address with. */
  prefill: { name: string; phone: string };
}) {
  const t = useStoreDictionary();
  const router = useRouter();
  const { lines, setCartQty, replaceCart, clearCartLocally } = useCartContext();
  const [addressId, setAddressId] = useState<string>(
    defaultAddressId ?? addresses[0]?.id ?? "new"
  );
  const [saveNew, setSaveNew] = useState(true);
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);
  const [products, setProducts] = useState<CartProduct[] | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [placed, setPlaced] = useState(false);

  const idsKey = useMemo(() => [...new Set(lines.map((l) => l.productId))].sort().join(","), [lines]);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    fetch(`/api/store/cart?ids=${encodeURIComponent(idsKey)}`)
      .then((r) => r.json())
      .then((data: CartProduct[]) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey, reloadKey]);

  const rows = lines.map((line) => {
    const product = products?.find((p) => p._id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return { line, product, variant };
  });
  const loading = lines.length > 0 && products === null;
  const valid = rows.filter((r) => r.product && r.variant && r.variant.stock >= r.line.qty);
  const hasProblems = !loading && valid.length !== rows.length;
  const subtotal = valid.reduce((sum, r) => sum + r.product!.price * r.line.qty, 0);
  // The preview discount was computed for the subtotal at the time; drop it if the cart changed since.
  const [voucherFor, setVoucherFor] = useState(0);
  const activeVoucher = voucher && voucherFor === subtotal ? voucher : null;

  /** Drops lines that no longer exist and caps quantities at current stock. */
  function fixCart() {
    const next: CartLine[] = [];
    for (const r of rows) {
      if (!r.product || !r.variant || r.variant.stock === 0) continue;
      next.push({ ...r.line, qty: Math.min(r.line.qty, r.variant.stock) });
    }
    replaceCart(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasProblems) {
      fixCart();
      setError(t.store.adjusted);
      return;
    }
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const note = text("note") || undefined;
    let chosen = addresses.find((a) => a.id === addressId);
    setPlacing(true);
    setError(null);
    try {
      if (!chosen) {
        const fresh = {
          label: t.account.defaultLabel,
          recipient: text("name"),
          phone: text("phone"),
          address: text("address"),
          city: text("city"),
          postalCode: text("postalCode"),
        };
        if (saveNew) {
          const saved = await fetch("/api/store/account/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fresh),
          });
          if (saved.ok) chosen = await saved.json();
        }
        chosen ??= { id: "", ...fresh };
      }
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: valid.map((r) => r.line),
          voucherCode: activeVoucher?.code,
          customer: {
            name: chosen.recipient,
            phone: chosen.phone,
            address: chosen.address,
            city: chosen.city,
            postalCode: chosen.postalCode,
            note,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && data.error === "voucher") {
        const key = data.voucherError as keyof typeof t.store.voucherErrors;
        setError(t.store.voucherErrors[key] ?? t.store.voucherErrors.generic);
        setVoucher(null);
        setPlacing(false);
        return;
      }
      if (!res.ok) {
        const code = (data.error as ErrorCode) in t.store.errors ? (data.error as ErrorCode) : "generic";
        setError(t.store.errors[code]);
        if (code === "out_of_stock" || code === "unavailable") setReloadKey((k) => k + 1);
        setPlacing(false);
        return;
      }
      setPlaced(true);
      clearCartLocally();
      // Opening WhatsApp from here would be popup-blocked after the await;
      // the order page shows the button instead.
      router.push(`/narras/order/${data.id}`);
    } catch {
      setError(t.store.errors.generic);
      setPlacing(false);
    }
  }

  if (placed) {
    return <p className="py-16 text-center text-brown-soft">{t.store.placing}</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-brown-soft">{t.store.cartEmpty}</p>
        <Link href="/narras" className="mt-4 inline-block rounded-full bg-brown px-6 py-2.5 text-sm font-semibold text-cream">
          {t.store.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-brown/10 border-y border-brown/10">
        {rows.map(({ line, product, variant }) => {
          const unavailable = !loading && (!product || !variant || variant.stock === 0);
          return (
            <li key={`${line.productId}:${line.variantId}`} className="flex gap-4 py-4">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-brown/5">
                {product?.image && <Image src={product.image} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                {product ? (
                  <Link href={`/narras/p/${product.slug}`} className="text-sm font-medium text-brown hover:underline">
                    {product.title}
                  </Link>
                ) : (
                  <p className="h-4 w-32 animate-pulse rounded bg-brown/10" />
                )}
                <p className="text-xs text-brown-soft">{variant?.name}</p>
                {unavailable ? (
                  <p className="mt-1 text-xs font-medium text-orange">{t.store.unavailableLine}</p>
                ) : (
                  product && <p className="mt-1 text-sm font-semibold text-brown">{formatRupiah(product.price * line.qty)}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  {!unavailable && variant && (
                    <div className="flex items-center rounded-full border border-brown/20">
                      <button
                        type="button"
                        aria-label="-"
                        onClick={() => setCartQty(line.productId, line.variantId, line.qty - 1)}
                        className="p-2 text-brown"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums text-brown">{line.qty}</span>
                      <button
                        type="button"
                        aria-label="+"
                        disabled={line.qty >= variant.stock}
                        onClick={() => setCartQty(line.productId, line.variantId, line.qty + 1)}
                        className="p-2 text-brown disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setCartQty(line.productId, line.variantId, 0)}
                    className="text-xs text-brown-soft underline hover:text-orange"
                  >
                    {t.store.remove}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={onSubmit} className="h-fit space-y-3 rounded-3xl border border-brown/10 bg-surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brown-soft">{t.store.subtotal}</span>
          <span className={activeVoucher ? "text-sm text-brown" : "text-lg font-semibold text-brown"}>
            {loading ? "…" : formatRupiah(subtotal)}
          </span>
        </div>
        {activeVoucher && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brown-soft">
                {t.store.discount} ({activeVoucher.code})
              </span>
              <span className="text-brown">−{formatRupiah(activeVoucher.discount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brown-soft">{t.store.total}</span>
              <span className="text-lg font-semibold text-brown">{formatRupiah(subtotal - activeVoucher.discount)}</span>
            </div>
          </>
        )}
        {!loading && valid.length > 0 && (
          <VoucherField
            subtotal={subtotal}
            applied={activeVoucher}
            onChange={(v) => {
              setVoucher(v);
              setVoucherFor(subtotal);
            }}
          />
        )}
        <p className="text-xs text-brown-soft">{t.store.shippingNote}</p>

        <h2 className="pt-3 text-sm font-semibold text-brown">{t.store.checkoutTitle}</h2>
        {addresses.length > 0 && (
          <div className="space-y-2" role="radiogroup" aria-label={t.store.checkoutTitle}>
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${
                  addressId === a.id ? "border-brown bg-brown/5" : "border-brown/15"
                }`}
              >
                <input
                  type="radio"
                  name="addressChoice"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-1 accent-[var(--color-brown)]"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-brown">
                    {a.label} · {a.recipient}
                  </span>
                  <span className="block text-xs text-brown-soft">{a.phone}</span>
                  <span className="block text-xs text-brown-soft">
                    {a.address}, {a.city} {a.postalCode}
                  </span>
                </span>
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                addressId === "new" ? "border-brown bg-brown/5" : "border-brown/15"
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressId === "new"}
                onChange={() => setAddressId("new")}
                className="accent-[var(--color-brown)]"
              />
              <span className="font-medium text-brown">+ {t.account.newAddress}</span>
            </label>
          </div>
        )}
        {addressId === "new" && (
          <>
        <input name="name" defaultValue={prefill.name} required minLength={2} maxLength={80} autoComplete="name" placeholder={t.store.name} aria-label={t.store.name} className={inputClass} />
        <input
          name="phone"
          defaultValue={prefill.phone}
          required
          type="tel"
          inputMode="tel"
          pattern="^\+?[\d\s\-]{8,20}$"
          autoComplete="tel"
          placeholder={`${t.store.phone} (08…)`}
          aria-label={t.store.phone}
          className={inputClass}
        />
        <textarea
          name="address"
          required
          minLength={8}
          maxLength={400}
          rows={3}
          autoComplete="street-address"
          placeholder={t.store.addressPlaceholder}
          aria-label={t.store.address}
          className={inputClass}
        />
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <input name="city" required minLength={2} maxLength={80} autoComplete="address-level2" placeholder={t.store.city} aria-label={t.store.city} className={inputClass} />
          <input
            name="postalCode"
            required
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            autoComplete="postal-code"
            placeholder={t.store.postalCode}
            aria-label={t.store.postalCode}
            className={inputClass}
          />
        </div>
            <label className="flex items-center gap-2 text-xs text-brown-soft">
              <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} className="accent-[var(--color-brown)]" />
              {t.account.saveAddress}
            </label>
          </>
        )}
        <input name="note" maxLength={300} placeholder={t.store.note} aria-label={t.store.note} className={inputClass} />

        {error && (
          <p role="alert" className="text-sm text-orange">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={placing || loading || valid.length === 0}
          className="w-full rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {placing ? t.store.placing : t.store.placeOrder}
        </button>
      </form>
    </div>
  );
}
