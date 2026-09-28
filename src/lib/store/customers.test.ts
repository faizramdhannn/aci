import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import bcrypt from "bcryptjs";
import {
  changePassword,
  createResetToken,
  deleteAddress,
  findOrCreateGoogleCustomer,
  getCustomerById,
  registerCustomer,
  resetPassword,
  saveAddress,
} from "@/lib/store/customers";
import { safeCallback } from "@/lib/store/safe-callback";

const base = { name: "Siti", email: "Siti@Example.com", phone: "0812345678", password: "rahasia123" };
const addr = { label: "Rumah", recipient: "Siti", phone: "0812345678", address: "Jl. Mawar 1", city: "Bandung", postalCode: "40111" };

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
});

describe("customer accounts", () => {
  it("registers with a lowercased email, hashed password, and rejects duplicates", async () => {
    const c = await registerCustomer(base);
    expect(c.email).toBe("siti@example.com");
    expect(await bcrypt.compare("rahasia123", c.passwordHash!)).toBe(true);
    await expect(registerCustomer({ ...base, email: "siti@example.com" })).rejects.toMatchObject({ code: "email_taken" });
  });

  it("links Google sign-in to an existing email account", async () => {
    const c = await registerCustomer(base);
    const g = await findOrCreateGoogleCustomer({ email: "siti@example.com", name: "S", googleId: "g1" });
    expect(g._id).toBe(c._id);
    expect((await getCustomerById(c._id))!.googleId).toBe("g1");
    const fresh = await findOrCreateGoogleCustomer({ email: "new@example.com", name: "New", googleId: "g2" });
    expect(fresh.passwordHash).toBeUndefined();
  });

  it("changes a password only with the current one; Google-only accounts can set a first one", async () => {
    const c = await registerCustomer(base);
    await expect(changePassword(c._id, "wrong", "baru12345")).rejects.toMatchObject({ code: "wrong_password" });
    await changePassword(c._id, "rahasia123", "baru12345");
    expect(await bcrypt.compare("baru12345", (await getCustomerById(c._id))!.passwordHash!)).toBe(true);

    const g = await findOrCreateGoogleCustomer({ email: "g@example.com", name: "G", googleId: "g" });
    await changePassword(g._id, undefined, "pertama123");
    expect((await getCustomerById(g._id))!.passwordHash).toBeTruthy();
  });

  it("keeps a sensible default address", async () => {
    const c = await registerCustomer(base);
    const home = await saveAddress(c._id, addr, false);
    expect((await getCustomerById(c._id))!.defaultAddressId).toBe(home.id);
    const office = await saveAddress(c._id, { ...addr, label: "Kantor" }, true);
    expect((await getCustomerById(c._id))!.defaultAddressId).toBe(office.id);
    await saveAddress(c._id, { ...office, city: "Jakarta" }, false);
    expect((await getCustomerById(c._id))!.addresses.find((a) => a.id === office.id)!.city).toBe("Jakarta");
    await deleteAddress(c._id, office.id);
    expect((await getCustomerById(c._id))!.defaultAddressId).toBe(home.id);
  });

  it("resets a password with a one-time token", async () => {
    const c = await registerCustomer(base);
    const token = await createResetToken(c._id);
    await resetPassword(token, "reset12345");
    expect(await bcrypt.compare("reset12345", (await getCustomerById(c._id))!.passwordHash!)).toBe(true);
    await expect(resetPassword(token, "again12345")).rejects.toMatchObject({ code: "invalid_token" });
    await expect(resetPassword("x".repeat(40), "again12345")).rejects.toMatchObject({ code: "invalid_token" });
  });
});

describe("safeCallback", () => {
  it("only allows same-site paths", () => {
    expect(safeCallback("/narras/cart")).toBe("/narras/cart");
    expect(safeCallback("//evil.com")).toBe("/narras");
    expect(safeCallback("https://evil.com")).toBe("/narras");
    expect(safeCallback("/\\evil.com")).toBe("/narras");
    expect(safeCallback(undefined)).toBe("/narras");
  });
});
