import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import { getContentVersion } from "@/lib/content-version";
import { deleteStoreProduct, updateStoreProduct, updateStoreSettings } from "@/lib/store/data";

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
});

describe("getContentVersion", () => {
  it("is stable until content changes, then changes on edits, deletes and settings", async () => {
    const v1 = await getContentVersion();
    expect(await getContentVersion()).toBe(v1);
    await updateStoreProduct("prod-bergo", { title: "Bergo Baru" });
    const v2 = await getContentVersion();
    expect(v2).not.toBe(v1);
    await updateStoreSettings({ tagline: "Baru" });
    const v3 = await getContentVersion();
    expect(v3).not.toBe(v2);
    await deleteStoreProduct("prod-bergo");
    expect(await getContentVersion()).not.toBe(v3);
  });
});
