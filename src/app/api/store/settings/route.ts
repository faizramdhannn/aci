import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storeSettingsSchema } from "@/lib/store/schemas";
import { updateStoreSettings } from "@/lib/store/data";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = storeSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ error: "invalid", field: field ? String(field) : undefined }, { status: 400 });
  }
  await updateStoreSettings(parsed.data);
  return NextResponse.json({ ok: true });
}
