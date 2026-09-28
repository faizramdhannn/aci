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
  const previous = (await getStoreSettings()).heroBanners ?? [];
  await updateStoreSettings(
    // Saving the new list retires the old single-banner fields.
    parsed.data.heroBanners ? { ...parsed.data, heroImage: "", heroTitle: "", heroSubtitle: "" } : parsed.data
  );
  if (parsed.data.heroBanners) {
    const kept = new Set(parsed.data.heroBanners.map((b) => b.image));
    for (const banner of previous) {
      if (!kept.has(banner.image)) await deleteSettingImageIfUnused(banner.image);
    }
  }
  return NextResponse.json({ ok: true });
}
