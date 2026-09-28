"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, StoreOrder } from "@/types/store";
import { Card, adminInput, primaryButton, secondaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

/** The natural next step for each status — shown as the primary button. */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "paid",
  paid: "shipped",
  shipped: "completed",
  cancelled: "pending",
};

export function OrderActions({ order }: { order: StoreOrder }) {
  const t = useStoreDictionary();
  const toast = useToast();
  const router = useRouter();
  const [shipping, setShipping] = useState(order.shippingCost != null ? String(order.shippingCost) : "");
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [note, setNote] = useState(order.adminNote ?? "");
  const [busy, setBusy] = useState(false);

  async function save(extra: { status?: OrderStatus } = {}) {
    setBusy(true);
    const res = await fetch(`/api/store/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingCost: shipping.trim() === "" ? null : Number(shipping.replace(/\D/g, "")),
        courier,
        trackingNumber: tracking,
        adminNote: note,
        ...extra,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error === "out_of_stock" ? t.admin.orders.outOfStock : t.admin.orders.failed, "error");
      return;
    }
    toast(t.admin.orders.saved);
    router.refresh();
  }

  const next = NEXT[order.status];

  return (
    <Card title={t.admin.orders.fulfilment}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-brown-soft">{t.admin.orders.shippingCost}</span>
          <input
            inputMode="numeric"
            value={shipping}
            onChange={(e) => setShipping(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="15000"
            className={adminInput}
          />
          <span className="mt-1 block text-xs text-brown-soft">{t.admin.orders.shippingHint}</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-brown-soft">{t.admin.orders.courier}</span>
          <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="JNE / J&T / SiCepat" className={adminInput} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-brown-soft">{t.admin.orders.trackingNumber}</span>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={adminInput} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-brown-soft">{t.admin.orders.adminNote}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={adminInput} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => save()} className={secondaryButton}>
          {t.admin.orders.save}
        </button>
        {next && (
          <button type="button" disabled={busy} onClick={() => save({ status: next })} className={primaryButton}>
            {t.admin.orders.markAs}: {t.statuses[next]}
          </button>
        )}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t.admin.orders.cancelConfirm)) save({ status: "cancelled" });
            }}
            className="ml-auto text-xs text-brown-soft hover:text-red-500"
          >
            {t.admin.orders.cancel}
          </button>
        )}
      </div>
    </Card>
  );
}
