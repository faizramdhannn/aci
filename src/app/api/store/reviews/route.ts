import { NextResponse } from "next/server";
import { z } from "zod";
import { customerId } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";
import { canReview, saveReview } from "@/lib/store/reviews";
import { allowRateLimitedHit } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).default(""),
});

export async function POST(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await allowRateLimitedHit(id, { scope: "review", max: 5 }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!(await canReview(id, parsed.data.productId))) return NextResponse.json({ error: "not_eligible" }, { status: 403 });
  const customer = await getCustomerById(id);
  const review = await saveReview({ ...parsed.data, customerId: id, name: customer?.name ?? "" });
  return NextResponse.json(review, { status: 201 });
}
