import { NextResponse } from "next/server";
import { customerId } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/store/account-schemas";
import { changePassword, CustomerError } from "@/lib/store/customers";

export async function POST(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await changePassword(id, parsed.data.current, parsed.data.next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CustomerError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
