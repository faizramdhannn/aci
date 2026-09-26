import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteAnnotation, getShoppableImageById, listAnnotationsForImage, upsertAnnotation } from "@/lib/data";
import type { Annotation } from "@/types";

const patchSchema = z.object({
  shoppableImageId: z.string().min(1),
  style: z.enum(["straight", "curved", "spiral"]).optional(),
  color: z.string().optional(),
  strokeWidth: z.number().positive().optional(),
  x1: z.number().min(0).max(1).optional(),
  y1: z.number().min(0).max(1).optional(),
  x2: z.number().min(0).max(1).optional(),
  y2: z.number().min(0).max(1).optional(),
  rotation: z.number().optional(),
  text: z.string().min(1).max(200).optional(),
  fontFamily: z.enum(["Manrope", "Caveat", "Playfair Display", "Bebas Neue"]).optional(),
  fontSize: z.number().positive().optional(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = (await listAnnotationsForImage(parsed.data.shoppableImageId)).find((a) => a._id === id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = { ...existing, ...parsed.data, updatedAt: new Date().toISOString() };
  await upsertAnnotation(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteAnnotation(id);
  return NextResponse.json({ ok: true });
}

// Older documents can hold null in optional fields; treat it as absent.
const nullable = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => (v === null ? undefined : v), schema);

const putSchema = z.object({
  shoppableImageId: z.string().min(1),
  kind: z.enum(["arrow", "text"]),
  color: nullable(z.string().min(1).default("#5A3D2B")),
  rotation: z.number().default(0),
  style: nullable(z.enum(["straight", "curved", "spiral"]).optional()),
  strokeWidth: nullable(z.number().positive().optional()),
  x1: nullable(z.number().min(0).max(1).optional()),
  y1: nullable(z.number().min(0).max(1).optional()),
  x2: nullable(z.number().min(0).max(1).optional()),
  y2: nullable(z.number().min(0).max(1).optional()),
  text: nullable(z.string().min(1).max(200).optional()),
  fontFamily: nullable(z.enum(["Manrope", "Caveat", "Playfair Display", "Bebas Neue"]).optional()),
  fontSize: nullable(z.number().positive().optional()),
  x: nullable(z.number().min(0).max(1).optional()),
  y: nullable(z.number().min(0).max(1).optional()),
  createdAt: nullable(z.string().optional()),
});

/** Full upsert by id — the editor's undo/redo uses it to restore an annotation exactly, including one that was deleted. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const image = await getShoppableImageById(parsed.data.shoppableImageId);
  if (!image) return NextResponse.json({ error: "Look not found" }, { status: 404 });

  const now = new Date().toISOString();
  const annotation: Annotation = {
    ...parsed.data,
    _id: id,
    ownerId: image.ownerId,
    createdAt: parsed.data.createdAt ?? now,
    updatedAt: now,
  };
  await upsertAnnotation(annotation);
  return NextResponse.json(annotation);
}
