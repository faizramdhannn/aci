import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { mergeProducts } from "@/lib/store/merge";

export async function POST(request: Request) {
  if (!(await adminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z
    .object({ ids: z.array(z.string().min(1).max(64)).min(2).max(20), title: z.string().trim().max(120).optional() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const product = await mergeProducts(parsed.data.ids, parsed.data.title);
  return NextResponse.json({ id: product._id });
}
