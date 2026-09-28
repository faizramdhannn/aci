import { describe, expect, it } from "vitest";
import { colourOptions, filterProducts } from "@/lib/store/catalog";
import { seedStoreProducts } from "@/lib/store/seed";

const products = seedStoreProducts;
const titles = (list: typeof products) => list.map((p) => p.title);

describe("filterProducts", () => {
  it("searches title, description and colours, all words required", () => {
    expect(titles(filterProducts(products, { q: "voal" }))).toEqual(["Segi Empat Voal Premium"]);
    expect(titles(filterProducts(products, { q: "dusty pink" }))).toEqual(["Segi Empat Voal Premium"]);
    expect(filterProducts(products, { q: "voal olive" })).toHaveLength(0);
  });

  it("filters by collection, colour and stock", () => {
    expect(titles(filterProducts(products, { collectionId: "col-instan" }))).toEqual(["Bergo Jersey Instan"]);
    expect(titles(filterProducts(products, { colour: "black" }))).toEqual(["Pashmina Ceruty Babydoll"]);
    // Black exists but is sold out.
    expect(filterProducts(products, { colour: "Black", inStockOnly: true })).toHaveLength(0);
  });

  it("sorts", () => {
    expect(filterProducts(products, { sort: "price-asc" }).map((p) => p.price)).toEqual([45000, 55000, 69000]);
    expect(titles(filterProducts(products, { sort: "newest" }))[0]).toBe("Bergo Jersey Instan");
  });

  it("lists each colour once", () => {
    expect(colourOptions(products)).toContain("Dusty Pink");
    expect(new Set(colourOptions(products)).size).toBe(colourOptions(products).length);
  });
});

import { relatedProducts } from "@/lib/store/catalog";

describe("relatedProducts", () => {
  it("excludes the product itself and prefers the same collection", () => {
    const extra = { ...products[0], _id: "prod-x", title: "Pashmina Lain", collectionIds: ["col-pashmina"], createdAt: "2026-01-01T00:00:00.000Z" };
    const related = relatedProducts(products[0], [...products, extra]);
    expect(related[0]._id).toBe("prod-x");
    expect(related.map((p) => p._id)).not.toContain(products[0]._id);
  });
});
