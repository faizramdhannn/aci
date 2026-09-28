import { NextResponse } from "next/server";
import { z } from "zod";
import { addComment } from "@/lib/comments";
import { getShoppableImageById } from "@/lib/data";
import { getStoreProductById } from "@/lib/store/data";
import { allowRateLimitedHit } from "@/lib/rate-limit";

const schema = z.object({
  target: z.enum(["look", "product"]),
  targetId: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(40),
  body: z.string().trim().min(2).max(500),
  // Honeypot: a hidden field real visitors leave empty.
  website: z.string().max(0).optional(),
});

/** Public: anyone can comment on a published look or an active product. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allowRateLimitedHit(ip, { scope: "comment", max: 3 }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { target, targetId, name, body } = parsed.data;

  const exists =
    target === "look"
      ? (await getShoppableImageById(targetId))?.status === "published"
      : (await getStoreProductById(targetId))?.status === "active";
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const comment = await addComment({ target, targetId, name, body });
  return NextResponse.json(comment, { status: 201 });
}
