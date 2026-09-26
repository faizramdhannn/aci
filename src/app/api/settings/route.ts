import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteImageIfUnused, getSiteSettings, updateSiteSettings } from "@/lib/data";

const optionalUrl = z.union([z.literal(""), z.string().url()]).optional();

const patchSchema = z.object({
  siteName: z.string().trim().min(1).max(60).optional(),
  creatorName: z.string().trim().max(80).optional(),
  tagline: z.string().trim().max(160).optional(),
  about: z.string().trim().max(600).optional(),
  avatarUrl: z.string().optional(),
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  email: z.union([z.literal(""), z.string().email()]).optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ error: field ? `Check the "${String(field)}" field.` : "Invalid settings." }, { status: 400 });
  }

  const previousAvatar = (await getSiteSettings()).avatarUrl;
  await updateSiteSettings(parsed.data);
  if (parsed.data.avatarUrl !== undefined && parsed.data.avatarUrl !== previousAvatar) {
    await deleteImageIfUnused(previousAvatar);
  }
  return NextResponse.json({ ok: true });
}
