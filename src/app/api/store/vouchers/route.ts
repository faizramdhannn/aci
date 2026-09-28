import { NextResponse } from "next/server";
import { adminSession } from "@/lib/auth";
import { saveVoucher, VoucherCodeTaken } from "@/lib/store/vouchers";
import { voucherSchema } from "@/lib/store/voucher-schema";

export async function POST(request: Request) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = voucherSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const voucher = await saveVoucher({
      code: d.code,
      type: d.type,
      value: d.value,
      active: d.active,
      ...(d.maxDiscount ? { maxDiscount: d.maxDiscount } : {}),
      ...(d.minSubtotal ? { minSubtotal: d.minSubtotal } : {}),
      ...(d.maxUses ? { maxUses: d.maxUses } : {}),
      ...(d.expiresAt ? { expiresAt: d.expiresAt } : {}),
    });
    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    if (error instanceof VoucherCodeTaken) return NextResponse.json({ error: "code_taken" }, { status: 409 });
    throw error;
  }
}
