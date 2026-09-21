import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteHotspot, getHotspotById, upsertHotspot } from "@/lib/data";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  affiliateUrl: z.string().url().optional(),
  logoUrl: z.string().optional(),
  productPrice: z.number().nonnegative().optional(),
  marketplace: z.string().optional(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  width: z.number().min(0.01).max(1).optional(),
  height: z.number().min(0.01).max(1).optional(),
  rotation: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getHotspotById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = {
    ...existing,
    ...parsed.data,
    marketplace: (parsed.data.marketplace as typeof existing.marketplace) ?? existing.marketplace,
    updatedAt: new Date().toISOString(),
  };

  await upsertHotspot(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteHotspot(id);
  return NextResponse.json({ ok: true });
}
