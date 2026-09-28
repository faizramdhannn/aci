"use client";

import { useState } from "react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { formatRupiah } from "@/lib/store/money";
import { format } from "@/lib/i18n/dictionaries";

export interface AppliedVoucher {
  code: string;
  discount: number;
}

/** Code box that checks a voucher against the current subtotal. Not a <form>: it sits inside the checkout form. */
export function VoucherField({
  subtotal,
  applied,
  onChange,
}: {
  subtotal: number;
  applied: AppliedVoucher | null;
  onChange: (v: AppliedVoucher | null) => void;
}) {
  const t = useStoreDictionary().store;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/vouchers/check?code=${encodeURIComponent(code.trim())}&subtotal=${subtotal}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const key = data.error as keyof typeof t.voucherErrors;
        const message = t.voucherErrors[key] ?? t.voucherErrors.generic;
        setError(format(message, { amount: formatRupiah(data.minSubtotal ?? 0) }));
        return;
      }
      onChange({ code: data.code, discount: data.discount });
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-emerald-400/15 px-3 py-2 text-sm">
        <span className="font-medium text-brown">{format(t.voucherApplied, { code: applied.code })}</span>
        <button type="button" onClick={() => onChange(null)} className="text-xs text-brown-soft hover:text-red-500">
          {t.removeVoucher}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          maxLength={30}
          placeholder={t.voucher}
          aria-label={t.voucher}
          className="min-w-0 flex-1 rounded-xl border border-brown/20 bg-surface px-3.5 py-2 text-sm uppercase text-brown outline-none placeholder:normal-case focus:border-brown"
        />
        <button
          type="button"
          onClick={apply}
          disabled={busy || !code.trim()}
          className="shrink-0 rounded-xl border border-brown/20 px-4 text-sm font-medium text-brown hover:bg-brown/5 disabled:opacity-50"
        >
          {t.applyVoucher}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-orange">{error}</p>}
    </div>
  );
}
