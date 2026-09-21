import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getShoppableImageById, updateShoppableImage } from "@/lib/data";

const patchSchema = z.object({
  status: z.enum(["draft", "published"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
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
