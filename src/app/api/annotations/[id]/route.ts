import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteAnnotation, listAnnotationsForImage, upsertAnnotation } from "@/lib/data";

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
