import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminSession } from "@/lib/auth";
import { productSchema } from "@/lib/store/schemas";
import { createStoreProduct, generateProductSlug, listStoreProducts } from "@/lib/store/data";

/** Admin: active products, for linking one from a Spill Outfit look. */
export async function GET() {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await listStoreProducts({ activeOnly: true });
  return NextResponse.json(products.map((p) => ({ _id: p._id, title: p.title, slug: p.slug, price: p.price })));
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ error: "invalid", field: field ? String(field) : undefined }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { compareAtPrice, ...data } = parsed.data;
  const product = {
    ...data,
    ...(compareAtPrice ? { compareAtPrice } : {}),
    _id: randomUUID(),
    slug: await generateProductSlug(data.title),
    createdAt: now,
    updatedAt: now,
  };
  await createStoreProduct(product);
  return NextResponse.json(product, { status: 201 });
}
