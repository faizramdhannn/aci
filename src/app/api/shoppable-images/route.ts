import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createShoppableImage, listShoppableImages } from "@/lib/data";
import type { ShoppableImage } from "@/types";

const bodySchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().min(1),
  imageWidth: z.number().int().positive().default(900),
  imageHeight: z.number().int().positive().default(1350),
  description: z.string().optional(),
});

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8)
  );
}

export async function GET() {
  const images = await listShoppableImages();
  return NextResponse.json(images);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const now = new Date().toISOString();
  const image: ShoppableImage = {
    _id: randomUUID(),
    ownerId: "seed-owner",
    title: parsed.data.title,
    slug: slugify(parsed.data.title),
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl,
    imageWidth: parsed.data.imageWidth,
    imageHeight: parsed.data.imageHeight,
    categoryIds: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  await createShoppableImage(image);
  return NextResponse.json(image, { status: 201 });
}
