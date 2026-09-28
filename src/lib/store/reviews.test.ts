import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import { placeOrder, updateOrder } from "@/lib/store/data";
import { canReview, listReviews, ratingsByProduct, saveReview, setReviewStatus } from "@/lib/store/reviews";

const customer = { name: "Siti", phone: "0812345678", address: "Jl. Mawar 1", city: "Bandung", postalCode: "40111" };

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
});

describe("reviews", () => {
  it("only lets a buyer review once their order has shipped", async () => {
    const order = await placeOrder({ lines: [{ productId: "prod-bergo", variantId: "v-olive", qty: 1 }], customer, customerId: "c1" });
    expect(await canReview("c1", "prod-bergo")).toBe(false);
    await updateOrder(order._id, { status: "shipped" });
    expect(await canReview("c1", "prod-bergo")).toBe(true);
    expect(await canReview("c1", "prod-pashmina")).toBe(false);
    expect(await canReview("c2", "prod-bergo")).toBe(false);
  });

  it("keeps one review per buyer per product and averages active ones", async () => {
    await saveReview({ productId: "p", customerId: "a", name: "A", rating: 5, body: "" });
    const b = await saveReview({ productId: "p", customerId: "b", name: "B", rating: 2, body: "" });
    await saveReview({ productId: "p", customerId: "b", name: "B", rating: 4, body: "edited" });
    expect(await listReviews({ productId: "p" })).toHaveLength(2);
    expect(ratingsByProduct(await listReviews())).toEqual({ p: { average: 4.5, count: 2 } });

    await setReviewStatus(b._id, "draft");
    expect(ratingsByProduct(await listReviews())).toEqual({ p: { average: 5, count: 1 } });
  });
});
