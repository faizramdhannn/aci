import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { deleteCollection, updateCollection } from "@/lib/store/collections";
import { withRevalidate } from "@/lib/revalidate";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await updateCollection((await params).id, parsed.data);
  return NextResponse.json({ ok: true });
}

async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteCollection((await params).id);
  return NextResponse.json({ ok: true });
}

export const PATCH = withRevalidate(handlePATCH);
export const DELETE = withRevalidate(handleDELETE);
