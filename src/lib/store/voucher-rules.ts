import type { StoreVoucher } from "@/types/store";

/** Pure voucher maths, shared by the checkout preview and order placement. */

export type VoucherProblem = "inactive" | "expired" | "used_up" | "min_subtotal";

export function voucherProblem(v: StoreVoucher, subtotal: number, now = new Date()): VoucherProblem | null {
  if (!v.active) return "inactive";
  // expiresAt is a date (YYYY-MM-DD): valid through the end of that day in Jakarta.
  if (v.expiresAt && now.getTime() > new Date(`${v.expiresAt}T23:59:59+07:00`).getTime()) return "expired";
  if (v.maxUses != null && v.used >= v.maxUses) return "used_up";
  if (v.minSubtotal && subtotal < v.minSubtotal) return "min_subtotal";
  return null;
}

export function voucherDiscount(v: StoreVoucher, subtotal: number): number {
  const raw = v.type === "percent" ? Math.floor((subtotal * v.value) / 100) : v.value;
  const capped = v.type === "percent" && v.maxDiscount ? Math.min(raw, v.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");
