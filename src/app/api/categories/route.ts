import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCategory, listCategories } from "@/lib/data";
import type { Category } from "@/types";

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8)
  );
}

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await listCategories();
  const category: Category = {
    _id: randomUUID(),
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description,
    icon: parsed.data.icon,
    sortOrder: existing.length,
    isActive: true,
  };

  await createCategory(category);
  return NextResponse.json(category, { status: 201 });
}
