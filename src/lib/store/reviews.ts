import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import { listOrdersForCustomer } from "@/lib/store/data";
import type { StoreReview } from "@/types/store";

/** Star reviews, one per customer per product, only from customers whose order reached them. */

const COLLECTION = "reviews";
/** Order statuses that mean the buyer has (or is about to have) the product. */
const RECEIVED = new Set(["shipped", "completed"]);

export async function listReviews(opts: { productId?: string; status?: StoreReview["status"] } = {}): Promise<StoreReview[]> {
  const db = await getDb();
  const all = db
    ? await db
        .collection<StoreReview>(COLLECTION)
        .find({ ...(opts.productId ? { productId: opts.productId } : {}), ...(opts.status ? { status: opts.status } : {}) })
        .toArray()
    : getMemoryStore().reviews.filter(
        (r) => (!opts.productId || r.productId === opts.productId) && (!opts.status || r.status === opts.status)
      );
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function canReview(customerId: string, productId: string): Promise<boolean> {
  const orders = await listOrdersForCustomer(customerId);
  return orders.some((o) => RECEIVED.has(o.status) && o.items.some((i) => i.productId === productId));
}

/** Creates or replaces this customer's review of the product. Edited reviews keep their moderation status. */
export async function saveReview(input: Pick<StoreReview, "productId" | "customerId" | "name" | "rating" | "body">): Promise<StoreReview> {
  const db = await getDb();
  const existing = db
    ? await db.collection<StoreReview>(COLLECTION).findOne({ productId: input.productId, customerId: input.customerId })
    : getMemoryStore().reviews.find((r) => r.productId === input.productId && r.customerId === input.customerId);
  const review: StoreReview = {
    ...input,
    _id: existing?._id ?? randomUUID(),
    status: existing?.status ?? "active",
    createdAt: new Date().toISOString(),
  };
  if (!db) {
    const store = getMemoryStore();
    store.reviews = [...store.reviews.filter((r) => r._id !== review._id), review];
  } else {
    await db.collection<StoreReview>(COLLECTION).replaceOne({ _id: review._id }, review, { upsert: true });
  }
  return review;
}

export async function setReviewStatus(id: string, status: StoreReview["status"]) {
  const db = await getDb();
  if (!db) {
    const r = getMemoryStore().reviews.find((x) => x._id === id);
    if (r) r.status = status;
    return;
  }
  await db.collection<StoreReview>(COLLECTION).updateOne({ _id: id }, { $set: { status } });
}

export async function deleteReview(id: string) {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.reviews = store.reviews.filter((r) => r._id !== id);
    return;
  }
  await db.collection<StoreReview>(COLLECTION).deleteOne({ _id: id });
}

export interface RatingSummary {
  average: number;
  count: number;
}

/** Average and count per product, from active reviews. */
export function ratingsByProduct(reviews: StoreReview[]): Record<string, RatingSummary> {
  const out: Record<string, RatingSummary> = {};
  for (const r of reviews) {
    if (r.status !== "active") continue;
    const s = (out[r.productId] ??= { average: 0, count: 0 });
    s.average = (s.average * s.count + r.rating) / (s.count + 1);
    s.count += 1;
  }
  return out;
}
