import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteShoppableImage, getShoppableImageById, updateShoppableImage } from "@/lib/data";

const patchSchema = z.object({
  status: z.enum(["draft", "published"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1).optional(),
  imageWidth: z.number().int().positive().optional(),
  imageHeight: z.number().int().positive().optional(),
  categoryIds: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getShoppableImageById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await updateShoppableImage(id, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getShoppableImageById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteShoppableImage(id);
  return NextResponse.json({ ok: true });
}
