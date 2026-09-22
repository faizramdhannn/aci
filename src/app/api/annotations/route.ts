import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { upsertAnnotation } from "@/lib/data";
import type { Annotation } from "@/types";

const bodySchema = z.object({
  shoppableImageId: z.string().min(1),
  style: z.enum(["straight", "curved", "spiral"]),
  color: z.string().min(1),
  strokeWidth: z.number().positive(),
  x1: z.number().min(0).max(1),
  y1: z.number().min(0).max(1),
  x2: z.number().min(0).max(1),
  y2: z.number().min(0).max(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const now = new Date().toISOString();
  const annotation: Annotation = {
    _id: randomUUID(),
    ownerId: "seed-owner",
    kind: "arrow",
    rotation: 0,
    createdAt: now,
    updatedAt: now,
    ...parsed.data,
  };

  await upsertAnnotation(annotation);
  return NextResponse.json(annotation, { status: 201 });
}
