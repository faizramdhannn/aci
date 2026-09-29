import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { deleteComment, setCommentStatus } from "@/lib/comments";
import { withRevalidate } from "@/lib/revalidate";

const patchSchema = z.object({ status: z.enum(["active", "draft"]) });

async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const found = await setCommentStatus((await params).id, parsed.data.status);
  return found ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteComment((await params).id);
  return NextResponse.json({ ok: true });
}

export const PATCH = withRevalidate(handlePATCH);
export const DELETE = withRevalidate(handleDELETE);
