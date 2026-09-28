import { NextResponse } from "next/server";
import { getStoreProductsByIds } from "@/lib/store/data";

/** Current price, stock and photo for the products in a visitor's cart (kept client-side). */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50);
  const products = await getStoreProductsByIds(ids);
  return NextResponse.json(
    products
      .filter((p) => p.status === "active")
      .map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        image: p.images[0] ?? null,
        variants: p.variants,
      }))
  );
}
