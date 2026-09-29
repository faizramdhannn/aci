import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { deleteCategory, updateCategory } from "@/lib/data";
import { withRevalidate } from "@/lib/revalidate";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await updateCategory(id, parsed.data);
  return NextResponse.json({ ok: true });
}

async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}

export const PATCH = withRevalidate(handlePATCH);
export const DELETE = withRevalidate(handleDELETE);
