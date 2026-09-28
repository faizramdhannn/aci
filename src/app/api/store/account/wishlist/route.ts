import { NextResponse } from "next/server";
import { z } from "zod";
import { customerId } from "@/lib/auth";
import { toggleWishlist } from "@/lib/store/customers";

export async function POST(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ productId: z.string().min(1).max(64) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  return NextResponse.json(await toggleWishlist(id, parsed.data.productId));
}
