import { NextResponse } from "next/server";
import { customerId } from "@/lib/auth";
import { getVoucherByCode } from "@/lib/store/vouchers";
import { voucherDiscount, voucherProblem } from "@/lib/store/voucher-rules";
import { allowRateLimitedHit } from "@/lib/rate-limit";

/** Checkout preview: is this code usable for this subtotal, and how much does it take off? */
export async function GET(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Slows down guessing codes.
  if (!(await allowRateLimitedHit(id, { scope: "voucher", max: 10 }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const subtotal = Math.max(0, Number(url.searchParams.get("subtotal")) || 0);
  const voucher = code ? await getVoucherByCode(code) : null;
  if (!voucher) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const problem = voucherProblem(voucher, subtotal);
  if (problem) return NextResponse.json({ error: problem, minSubtotal: voucher.minSubtotal }, { status: 400 });
  return NextResponse.json({ code: voucher.code, discount: voucherDiscount(voucher, subtotal) });
}
