"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreVoucher, VoucherType } from "@/types/store";
import { Card, adminInput, primaryButton, secondaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { formatRupiah } from "@/lib/store/money";
import { voucherProblem } from "@/lib/store/voucher-rules";
import { format } from "@/lib/i18n/dictionaries";

interface Draft {
  _id?: string;
  code: string;
  type: VoucherType;
  value: string;
  maxDiscount: string;
  minSubtotal: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
}

const toDraft = (v?: StoreVoucher): Draft => ({
  _id: v?._id,
  code: v?.code ?? "",
  type: v?.type ?? "percent",
  value: v ? String(v.value) : "",
  maxDiscount: v?.maxDiscount ? String(v.maxDiscount) : "",
  minSubtotal: v?.minSubtotal ? String(v.minSubtotal) : "",
  maxUses: v?.maxUses ? String(v.maxUses) : "",
  expiresAt: v?.expiresAt ?? "",
  active: v?.active ?? true,
});

const num = (s: string) => (s.trim() ? Number(s.replace(/\D/g, "")) : null);

export function VouchersManager({ vouchers }: { vouchers: StoreVoucher[] }) {
  const t = useStoreDictionary().admin.vouchers;
  const toast = useToast();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));
  const digits = (key: "value" | "maxDiscount" | "minSubtotal" | "maxUses") => ({
    inputMode: "numeric" as const,
    value: draft?.[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value.replace(/\D/g, "")),
    className: adminInput,
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    const body = {
      code: draft.code,
      type: draft.type,
      value: num(draft.value) ?? 0,
      maxDiscount: num(draft.maxDiscount),
      minSubtotal: num(draft.minSubtotal),
      maxUses: num(draft.maxUses),
      expiresAt: draft.expiresAt || null,
      active: draft.active,
    };
    const res = await fetch(draft._id ? `/api/store/vouchers/${draft._id}` : "/api/store/vouchers", {
      method: draft._id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const labels: Record<string, string> = { code: t.code, value: t.value, expiresAt: t.expiresAt };
      toast(data.error === "code_taken" ? t.codeTaken : format(t.failed, { field: labels[data.field] ?? data.field ?? "" }), "error");
      return;
    }
    toast(t.saved);
    setDraft(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm(t.deleteConfirm)) return;
    await fetch(`/api/store/vouchers/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {draft ? (
        <Card>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{t.code}</span>
              <input
                required
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_\-]+"
                value={draft.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="RAMADAN10"
                className={`${adminInput} uppercase`}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{t.type}</span>
              <select value={draft.type} onChange={(e) => set("type", e.target.value as VoucherType)} className={adminInput}>
                <option value="percent">{t.percent}</option>
                <option value="fixed">{t.fixed}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">
                {t.value} {draft.type === "percent" ? "(%)" : "(Rp)"}
              </span>
              <input required {...digits("value")} placeholder={draft.type === "percent" ? "10" : "15000"} />
            </label>
            {draft.type === "percent" && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-brown-soft">{t.maxDiscount}</span>
                <input {...digits("maxDiscount")} placeholder="20000" />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{t.minSubtotal}</span>
              <input {...digits("minSubtotal")} placeholder="100000" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{t.maxUses}</span>
              <input {...digits("maxUses")} placeholder="50" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-brown-soft">{t.expiresAt}</span>
              <input type="date" value={draft.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={adminInput} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-brown">
              <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="accent-[var(--color-brown)]" />
              {t.active}
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={busy} className={primaryButton}>
                {t.save}
              </button>
              <button type="button" onClick={() => setDraft(null)} className={secondaryButton}>
                {t.cancel}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <button type="button" onClick={() => setDraft(toDraft())} className={primaryButton}>
          + {t.add}
        </button>
      )}

      <Card className="!p-0">
        {vouchers.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-brown/10">
            {vouchers.map((v) => {
              const problem = voucherProblem(v, Number.MAX_SAFE_INTEGER);
              return (
                <li key={v._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono font-semibold text-brown">{v.code}</span>
                      {problem && (
                        <span className="rounded-full bg-brown/10 px-2 py-0.5 text-[11px] text-brown-soft">
                          {problem === "expired" ? t.expired : problem === "inactive" ? t.inactive : format(t.used, { used: v.used, max: `/${v.maxUses}` })}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-brown-soft">
                      {v.type === "percent" ? `${v.value}%` : formatRupiah(v.value)}
                      {v.type === "percent" && v.maxDiscount ? ` · max ${formatRupiah(v.maxDiscount)}` : ""}
                      {v.minSubtotal ? ` · min ${formatRupiah(v.minSubtotal)}` : ""}
                      {v.expiresAt ? ` · ≤ ${v.expiresAt}` : ""}
                      {" · "}
                      {format(t.used, { used: v.used, max: v.maxUses ? `/${v.maxUses}` : "" })}
                    </p>
                  </div>
                  <button type="button" onClick={() => setDraft(toDraft(v))} className="text-xs text-brown hover:underline">
                    {t.edit}
                  </button>
                  <button type="button" onClick={() => remove(v._id)} className="text-xs text-brown-soft hover:text-red-500">
                    {t.delete}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
