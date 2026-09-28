import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import {
  customersFromOrders,
  getOrderById,
  getStoreProductById,
  OrderError,
  placeOrder,
  salesSummary,
  updateOrder,
} from "@/lib/store/data";
import { toWhatsappDigits, orderMessage } from "@/lib/store/whatsapp";
import { formatRupiah } from "@/lib/store/money";

const customer = { name: "Siti", phone: "0812-3456-7890", address: "Jl. Mawar 1", city: "Bandung", postalCode: "40111" };

async function stockOf(productId: string, variantId: string) {
  return (await getStoreProductById(productId))!.variants.find((v) => v.id === variantId)!.stock;
}

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
});

describe("placeOrder", () => {
  it("prices from the catalog, reserves stock, and numbers orders", async () => {
    const order = await placeOrder({
      lines: [
        { productId: "prod-pashmina", variantId: "v-cream", qty: 2 },
        { productId: "prod-pashmina", variantId: "v-cream", qty: 1 },
      ],
      customer,
    });
    expect(order.number).toBe("NR-0001");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ qty: 3, price: 69000, variantName: "Cream" });
    expect(order.subtotal).toBe(207000);
    expect(order.status).toBe("pending");
    expect(await stockOf("prod-pashmina", "v-cream")).toBe(9);

    const second = await placeOrder({ lines: [{ productId: "prod-bergo", variantId: "v-olive", qty: 1 }], customer });
    expect(second.number).toBe("NR-0002");
  });

  it("takes nothing when any line is short", async () => {
    await expect(
      placeOrder({
        lines: [
          { productId: "prod-pashmina", variantId: "v-cream", qty: 1 },
          { productId: "prod-pashmina", variantId: "v-mocca", qty: 5 },
        ],
        customer,
      })
    ).rejects.toMatchObject({ code: "out_of_stock", detail: { variantId: "v-mocca" } });
    expect(await stockOf("prod-pashmina", "v-cream")).toBe(12);
    expect(await stockOf("prod-pashmina", "v-mocca")).toBe(4);
  });

  it("rejects unknown or draft products", async () => {
    await expect(
      placeOrder({ lines: [{ productId: "nope", variantId: "x", qty: 1 }], customer })
    ).rejects.toBeInstanceOf(OrderError);
    globalThis._aciMemoryStore!.storeProducts[0].status = "draft";
    await expect(
      placeOrder({ lines: [{ productId: "prod-pashmina", variantId: "v-cream", qty: 1 }], customer })
    ).rejects.toMatchObject({ code: "unavailable" });
  });
});

describe("updateOrder", () => {
  it("adds shipping to the total and returns stock on cancel, re-taking it on reopen", async () => {
    const order = await placeOrder({ lines: [{ productId: "prod-bergo", variantId: "v-olive", qty: 4 }], customer });
    expect(await stockOf("prod-bergo", "v-olive")).toBe(6);

    const shipped = await updateOrder(order._id, { shippingCost: 15000, status: "confirmed" });
    expect(shipped.total).toBe(order.subtotal + 15000);

    await updateOrder(order._id, { status: "cancelled" });
    expect(await stockOf("prod-bergo", "v-olive")).toBe(10);

    await updateOrder(order._id, { status: "pending" });
    expect(await stockOf("prod-bergo", "v-olive")).toBe(6);
  });

  it("refuses to reopen a cancelled order when the stock is gone", async () => {
    const order = await placeOrder({ lines: [{ productId: "prod-pashmina", variantId: "v-mocca", qty: 4 }], customer });
    await updateOrder(order._id, { status: "cancelled" });
    await placeOrder({ lines: [{ productId: "prod-pashmina", variantId: "v-mocca", qty: 4 }], customer });
    await expect(updateOrder(order._id, { status: "pending" })).rejects.toMatchObject({ code: "out_of_stock" });
    await expect(getOrderById(order._id)).resolves.toMatchObject({ status: "cancelled" });
  });
});

describe("customers and stats", () => {
  it("groups by normalized phone and skips cancelled orders in totals", async () => {
    const a = await placeOrder({ lines: [{ productId: "prod-bergo", variantId: "v-olive", qty: 1 }], customer });
    await placeOrder({
      lines: [{ productId: "prod-bergo", variantId: "v-olive", qty: 1 }],
      customer: { ...customer, phone: "+62 812 3456 7890" },
    });
    await updateOrder(a._id, { status: "cancelled" });
    const orders = globalThis._aciMemoryStore!.storeOrders;
    const [c] = customersFromOrders(orders);
    expect(customersFromOrders(orders)).toHaveLength(1);
    expect(c).toMatchObject({ orders: 1, spent: 45000 });

    await updateOrder(orders[1]._id, { status: "paid" });
    expect(salesSummary(globalThis._aciMemoryStore!.storeOrders)).toMatchObject({ today: 45000, toConfirm: 0 });
  });
});

describe("whatsapp helpers", () => {
  it("normalizes Indonesian numbers", () => {
    expect(toWhatsappDigits("0812-3456-7890")).toBe("6281234567890");
    expect(toWhatsappDigits("+62 812 3456 7890")).toBe("6281234567890");
    expect(toWhatsappDigits("812345678")).toBe("62812345678");
  });

  it("builds the order message", async () => {
    const order = await placeOrder({ lines: [{ productId: "prod-bergo", variantId: "v-olive", qty: 2 }], customer });
    const text = orderMessage(order, "https://x/narras/order/1");
    expect(text).toContain("NR-0001");
    expect(text).toContain("Bergo Jersey Instan — Olive x2");
    expect(text).toContain(formatRupiah(90000));
    expect(text).toContain("https://x/narras/order/1");
  });
});
