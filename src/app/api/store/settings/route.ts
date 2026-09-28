import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storeSettingsSchema } from "@/lib/store/schemas";
import { getStoreSettings, updateStoreSettings } from "@/lib/store/data";
import { deleteSettingImageIfUnused } from "@/lib/store/cleanup";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = storeSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ error: "invalid", field: field ? String(field) : undefined }, { status: 400 });
  }
  const previousHero = (await getStoreSettings()).heroImage;
  await updateStoreSettings(parsed.data);
  if (parsed.data.heroImage !== undefined && parsed.data.heroImage !== previousHero) {
    await deleteSettingImageIfUnused(previousHero);
  }
  return NextResponse.json({ ok: true });
}
