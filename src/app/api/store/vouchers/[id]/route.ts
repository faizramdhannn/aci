import { NextResponse } from "next/server";
import { adminSession } from "@/lib/auth";
import { deleteVoucher, saveVoucher, VoucherCodeTaken } from "@/lib/store/vouchers";
import { voucherSchema } from "@/lib/store/voucher-schema";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = voucherSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") }, { status: 400 });
  }
  const d = parsed.data;
  try {
    // Optional fields left empty are cleared (null) rather than kept.
    const voucher = await saveVoucher({
      _id: (await params).id,
      code: d.code,
      type: d.type,
      value: d.value,
      active: d.active,
      maxDiscount: d.maxDiscount || undefined,
      minSubtotal: d.minSubtotal || undefined,
      maxUses: d.maxUses || undefined,
      expiresAt: d.expiresAt || undefined,
    });
    return NextResponse.json(voucher);
  } catch (error) {
    if (error instanceof VoucherCodeTaken) return NextResponse.json({ error: "code_taken" }, { status: 409 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteVoucher((await params).id);
  return NextResponse.json({ ok: true });
}
