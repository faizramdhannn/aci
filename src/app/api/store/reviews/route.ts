import { NextResponse } from "next/server";
import { z } from "zod";
import { customerId } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";
import { canReview, listReviews, saveReview } from "@/lib/store/reviews";
import { allowRateLimitedHit } from "@/lib/rate-limit";
import { withRevalidate } from "@/lib/revalidate";

const schema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).default(""),
});

/** The signed-in customer's standing for a product: can they review it, and their existing review. */
export async function GET(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ eligible: false }, { headers: { "Cache-Control": "private, no-store" } });
  const productId = new URL(request.url).searchParams.get("productId") ?? "";
  const [eligible, reviews] = await Promise.all([canReview(id, productId), listReviews({ productId })]);
  const mine = reviews.find((r) => r.customerId === id);
  return NextResponse.json(
    { eligible, mine: mine ? { rating: mine.rating, body: mine.body } : null },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

async function handlePOST(request: Request) {
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

export const POST = withRevalidate(handlePOST);
