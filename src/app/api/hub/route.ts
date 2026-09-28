import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hubSettingsSchema } from "@/lib/store/schemas";
import { getHubSettings, updateHubSettings } from "@/lib/store/data";
import { deleteSettingImageIfUnused } from "@/lib/store/cleanup";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = hubSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const previous = await getHubSettings();
  await updateHubSettings(parsed.data);
  for (const key of ["outfitImage", "storeImage"] as const) {
    if (parsed.data[key] !== undefined && parsed.data[key] !== previous[key]) {
      await deleteSettingImageIfUnused(previous[key]);
    }
  }
  return NextResponse.json({ ok: true });
}
