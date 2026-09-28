import { NextResponse } from "next/server";
import { adminSession } from "@/lib/auth";
import { productSchema } from "@/lib/store/schemas";
import { deleteStoreProduct, generateProductSlug, getStoreProductById, updateStoreProduct } from "@/lib/store/data";
import { deleteStoredImage } from "@/lib/storage";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await getStoreProductById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = productSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ error: "invalid", field: field ? String(field) : undefined }, { status: 400 });
  }

  const { compareAtPrice, ...data } = parsed.data;
  const patch = {
    ...data,
    ...(compareAtPrice !== undefined ? { compareAtPrice: compareAtPrice || undefined } : {}),
    ...(data.title && data.title !== existing.title ? { slug: await generateProductSlug(data.title, id) } : {}),
  };
  await updateStoreProduct(id, patch);

  // Photos removed in this edit are no longer referenced anywhere.
  if (data.images) {
    const removed = existing.images.filter((url) => !data.images!.includes(url));
    await Promise.all(removed.map((url) => deleteStoredImage(url).catch(() => undefined)));
  }
  return NextResponse.json({ ok: true, slug: patch.slug ?? existing.slug });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteStoreProduct(id);
  return NextResponse.json({ ok: true });
}
