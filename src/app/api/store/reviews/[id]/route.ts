import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { deleteReview, setReviewStatus } from "@/lib/store/reviews";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ status: z.enum(["active", "draft"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await setReviewStatus((await params).id, parsed.data.status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteReview((await params).id);
  return NextResponse.json({ ok: true });
}
