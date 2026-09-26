import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteHotspot, getHotspotById, getShoppableImageById, upsertHotspot } from "@/lib/data";
import type { Hotspot } from "@/types";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  affiliateUrl: z.string().url().optional(),
  logoUrl: z.string().optional(),
  productPrice: z.number().nonnegative().optional(),
  marketplace: z.string().optional(),
  color: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
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

// Older documents can hold null in optional fields; treat it as absent.
const nullable = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => (v === null ? undefined : v), schema);

const putSchema = z.object({
  shoppableImageId: z.string().min(1),
  title: z.string().min(1),
  affiliateUrl: z.string().url(),
  description: nullable(z.string().optional()),
  logoUrl: nullable(z.string().optional()),
  productImageUrl: nullable(z.string().optional()),
  productPrice: nullable(z.number().nonnegative().optional()),
  // Lenient on purpose: hotspots created before these fields existed may
  // have no color or a free-form marketplace, and restoring them must work.
  marketplace: z
    .string()
    .nullish()
    .transform((m) =>
      ["shopee", "tokopedia", "tiktok-shop", "lazada", "instagram", "other"].includes(m ?? "")
        ? (m as Hotspot["marketplace"])
        : undefined
    ),
  color: nullable(z.string().min(1).default("#5A3D2B")),
  categoryIds: nullable(z.array(z.string()).default([])),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.01).max(1),
  height: z.number().min(0.01).max(1),
  rotation: z.number(),
  zIndex: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: nullable(z.string().optional()),
});

/** Full upsert by id — the editor's undo/redo uses it to restore a hotspot exactly, including one that was deleted. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const image = await getShoppableImageById(parsed.data.shoppableImageId);
  if (!image) return NextResponse.json({ error: "Look not found" }, { status: 404 });

  const now = new Date().toISOString();
  const hotspot: Hotspot = {
    ...parsed.data,
    _id: id,
    ownerId: image.ownerId,
    type: "product",
    createdAt: parsed.data.createdAt ?? now,
    updatedAt: now,
  };
  await upsertHotspot(hotspot);
  return NextResponse.json(hotspot);
}
