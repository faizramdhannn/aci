import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import { placeOrder, updateOrder } from "@/lib/store/data";
import { getVoucherByCode, saveVoucher } from "@/lib/store/vouchers";
import { voucherDiscount, voucherProblem } from "@/lib/store/voucher-rules";
import type { StoreVoucher } from "@/types/store";

const customer = { name: "Siti", phone: "0812345678", address: "Jl. Mawar 1", city: "Bandung", postalCode: "40111" };
const line = { productId: "prod-bergo", variantId: "v-olive", qty: 2 }; // 90.000

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
});

const v = (patch: Partial<StoreVoucher>): StoreVoucher => ({
  _id: "v",
  code: "X",
  type: "percent",
  value: 10,
  used: 0,
  active: true,
  createdAt: "",
  ...patch,
});

describe("voucher rules", () => {
  it("computes percent (with cap) and fixed discounts, never above the subtotal", () => {
    expect(voucherDiscount(v({ value: 10 }), 90000)).toBe(9000);
    expect(voucherDiscount(v({ value: 50, maxDiscount: 20000 }), 90000)).toBe(20000);
    expect(voucherDiscount(v({ type: "fixed", value: 15000 }), 90000)).toBe(15000);
    expect(voucherDiscount(v({ type: "fixed", value: 150000 }), 90000)).toBe(90000);
  });

  it("reports why a code can't be used", () => {
    expect(voucherProblem(v({ active: false }), 1)).toBe("inactive");
    expect(voucherProblem(v({ expiresAt: "2026-01-31" }), 1, new Date("2026-02-01T00:00:00+07:00"))).toBe("expired");
    expect(voucherProblem(v({ expiresAt: "2026-01-31" }), 1, new Date("2026-01-31T23:00:00+07:00"))).toBeNull();
    expect(voucherProblem(v({ maxUses: 1, used: 1 }), 1)).toBe("used_up");
    expect(voucherProblem(v({ minSubtotal: 100000 }), 90000)).toBe("min_subtotal");
  });
});

describe("vouchers at checkout", () => {
  it("applies the discount, counts the use, and gives it back on cancel", async () => {
    await saveVoucher({ code: "hemat10", type: "percent", value: 10, active: true, maxUses: 1 });
    const order = await placeOrder({ lines: [line], customer, voucherCode: "HEMAT10" });
    expect(order).toMatchObject({ subtotal: 90000, discount: 9000, total: 81000, voucherCode: "HEMAT10" });
    expect((await getVoucherByCode("hemat10"))!.used).toBe(1);

    await expect(placeOrder({ lines: [line], customer, voucherCode: "HEMAT10" })).rejects.toMatchObject({
      code: "voucher",
      detail: { voucherError: "used_up" },
    });

    const shipped = await updateOrder(order._id, { shippingCost: 10000 });
    expect(shipped.total).toBe(91000);

    await updateOrder(order._id, { status: "cancelled" });
    expect((await getVoucherByCode("hemat10"))!.used).toBe(0);
  });

  it("rejects unknown codes without taking stock", async () => {
    await expect(placeOrder({ lines: [line], customer, voucherCode: "NOPE" })).rejects.toMatchObject({
      detail: { voucherError: "not_found" },
    });
    expect(globalThis._aciMemoryStore!.storeProducts.find((p) => p._id === "prod-bergo")!.variants[0].stock).toBe(10);
  });
});
