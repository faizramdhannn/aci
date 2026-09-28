import { describe, expect, it } from "vitest";
import { ordersToCsv } from "@/lib/store/csv";
import type { StoreOrder } from "@/types/store";

describe("ordersToCsv", () => {
  it("quotes commas, quotes and newlines, and defuses formulas", () => {
    const order: StoreOrder = {
      _id: "1",
      number: "NR-0001",
      items: [{ productId: "p", variantId: "v", title: 'Pashmina "Premium"', variantName: "Cream", price: 1, qty: 2 }],
      subtotal: 2,
      total: 2,
      customer: { name: "=HYPERLINK(1)", phone: "0812", address: "Jl. A, No. 1\nRT 2", city: "Bandung", postalCode: "40111" },
      status: "paid",
      createdAt: "2026-09-28T03:00:00.000Z",
      updatedAt: "2026-09-28T03:00:00.000Z",
    };
    const csv = ordersToCsv([order]);
    expect(csv.startsWith("﻿Order,Date")).toBe(true);
    expect(csv).toContain("2026-09-28 10:00");
    expect(csv).toContain(`"Pashmina ""Premium"" (Cream) x2"`);
    expect(csv).toContain(`"Jl. A, No. 1\nRT 2"`);
    expect(csv).toContain("'=HYPERLINK(1)");
  });
});
