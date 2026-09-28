import { NextResponse } from "next/server";
import { customerId } from "@/lib/auth";
import { profileSchema } from "@/lib/store/account-schemas";
import { updateProfile } from "@/lib/store/customers";

export async function PATCH(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") }, { status: 400 });
  }
  await updateProfile(id, parsed.data);
  return NextResponse.json({ ok: true });
}
