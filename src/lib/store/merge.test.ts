import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import type { StoreProduct } from "@/types/store";
import { commonTitle, planMerge, titleSuffix } from "@/lib/store/merge-plan";
import { mergeProducts } from "@/lib/store/merge";
import { createStoreProduct, getStoreProductById, placeOrder } from "@/lib/store/data";
import { saveReview, listReviews } from "@/lib/store/reviews";
import { priceRange } from "@/lib/store/catalog";

const base = (n: number, patch: Partial<StoreProduct> = {}): StoreProduct => ({
  _id: `fa-${n}`,
  title: `Pashmina Ceruty Motif - Flowers Art ${n}`,
  slug: `pashmina-ceruty-motif-flowers-art-${n}`,
  description: n === 1 ? "Ceruty lembut" : "",
  price: 60000,
  images: [`/img/fa${n}.jpg`],
  variants: [{ id: "v-1", name: "Default", stock: n * 2 }],
  status: "active",
  createdAt: `2026-09-2${n}T00:00:00.000Z`,
  updatedAt: `2026-09-2${n}T00:00:00.000Z`,
  ...patch,
});

describe("merge planning", () => {
  it("finds the shared title and names variants after what differs", () => {
    expect(commonTitle(["Pashmina Ceruty Motif - Flowers Art 1", "Pashmina Ceruty Motif - Flowers Art 2"])).toBe(
      "Pashmina Ceruty Motif"
    );
    expect(titleSuffix("Pashmina Ceruty Motif - Flowers Art 2", "Pashmina Ceruty Motif")).toBe("Flowers Art 2");
    expect(commonTitle(["Segi Empat Polos", "Segi Empat Motif"])).toBe("Segi Empat");

    const plan = planMerge([base(1), base(2), base(3, { price: 65000 })], "Pashmina Ceruty Motif Flowers Art");
    expect(plan.product.title).toBe("Pashmina Ceruty Motif Flowers Art");
    expect(plan.product.variants.map((v) => v.name)).toEqual(["Flowers Art 1", "Flowers Art 2", "Flowers Art 3"]);
    expect(plan.product.variants.map((v) => v.image)).toEqual(["/img/fa1.jpg", "/img/fa2.jpg", "/img/fa3.jpg"]);
    expect(plan.product.variants.map((v) => v.price)).toEqual([undefined, undefined, 65000]);
    expect(new Set(plan.product.variants.map((v) => v.id)).size).toBe(3);
    expect(plan.product.images).toHaveLength(3);
    expect(plan.removedIds).toEqual(["fa-2", "fa-3"]);
    expect(priceRange(plan.product)).toEqual({ min: 60000, max: 65000 });
  });

  it("keeps old variant names when a source had several", () => {
    const plan = planMerge([
      base(1, { title: "Segi Empat Polos", variants: [{ id: "a", name: "Cream", stock: 1 }, { id: "b", name: "Black", stock: 1 }] }),
      base(2, { title: "Segi Empat Motif" }),
    ]);
    expect(plan.product.variants.map((v) => v.name)).toEqual(["Polos / Cream", "Polos / Black", "Motif"]);
  });
});

describe("mergeProducts", () => {
  beforeEach(() => {
    globalThis._aciMemoryStore = undefined;
  });

  it("moves orders, carts, wishlists and reviews to the merged product", async () => {
    for (const n of [1, 2, 3]) await createStoreProduct(base(n, n === 3 ? { price: 65000 } : {}));
    const customer = { name: "S", phone: "0812345678", address: "Jl. Mawar 1", city: "Bandung", postalCode: "40111" };
    const order = await placeOrder({ lines: [{ productId: "fa-3", variantId: "v-1", qty: 1 }], customer });
    expect(order.items[0].price).toBe(65000);
    await saveReview({ productId: "fa-2", customerId: "c", name: "C", rating: 5, body: "" });
    globalThis._aciMemoryStore!.customers.push({
      _id: "c",
      email: "c@x.id",
      name: "C",
      phone: "",
      addresses: [],
      cart: [{ productId: "fa-2", variantId: "v-1", qty: 1 }],
      wishlist: ["fa-3", "fa-1"],
      createdAt: "",
      updatedAt: "",
    });

    const merged = await mergeProducts(["fa-1", "fa-2", "fa-3"], "Pashmina Ceruty Motif");
    expect(await getStoreProductById("fa-2")).toBeNull();
    expect((await getStoreProductById("fa-1"))!.variants).toHaveLength(3);

    const store = globalThis._aciMemoryStore!;
    const v3 = merged.variants[2].id;
    expect(store.storeOrders[0].items[0]).toMatchObject({ productId: "fa-1", variantId: v3 });
    expect(store.customers[0].cart[0]).toMatchObject({ productId: "fa-1", variantId: merged.variants[1].id });
    expect(store.customers[0].wishlist).toEqual(["fa-1"]);
    expect((await listReviews({ productId: "fa-1" })).length).toBe(1);

    // Ordering the variant that came from product 3 still charges its own price.
    const again = await placeOrder({ lines: [{ productId: "fa-1", variantId: v3, qty: 1 }], customer });
    expect(again.items[0]).toMatchObject({ price: 65000, image: "/img/fa3.jpg" });
  });
});
