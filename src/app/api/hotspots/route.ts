import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { upsertHotspot } from "@/lib/data";
import type { Hotspot } from "@/types";

const bodySchema = z.object({
  shoppableImageId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  affiliateUrl: z.string().url(),
  logoUrl: z.string().optional(),
  productImageUrl: z.string().optional(),
  productPrice: z.number().nonnegative().optional(),
  marketplace: z.string().optional(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.01).max(1),
  height: z.number().min(0.01).max(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const now = new Date().toISOString();
  const hotspot: Hotspot = {
    _id: randomUUID(),
    ownerId: "seed-owner",
    type: "product",
    rotation: 0,
    zIndex: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...parsed.data,
    marketplace: parsed.data.marketplace as Hotspot["marketplace"],
  };

  await upsertHotspot(hotspot);
  return NextResponse.json(hotspot, { status: 201 });
}
