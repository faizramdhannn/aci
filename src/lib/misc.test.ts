import { afterEach, describe, expect, it, vi } from "vitest";
import { paginate } from "@/lib/pagination";
import { dictionaries, format } from "@/lib/i18n/dictionaries";
import { adminDictionaries } from "@/lib/i18n/admin-dictionaries";
import { storeNameFor } from "@/lib/store-name";
import { allowRateLimitedHit, resetInMemoryRateLimit } from "@/lib/rate-limit";

describe("paginate", () => {
  it("slices pages and clamps out-of-range requests", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 1, 12)).toMatchObject({ page: 1, totalPages: 3, total: 25, items: items.slice(0, 12) });
    expect(paginate(items, 3, 12).items).toEqual([24]);
    expect(paginate(items, 99, 12).page).toBe(3);
    expect(paginate([], 1, 12)).toMatchObject({ page: 1, totalPages: 1, items: [] });
  });
});

describe("i18n", () => {
  function keys(obj: object, prefix = ""): string[] {
    return Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    );
  }

  it("has every English string translated to Indonesian", () => {
    expect(keys(dictionaries.id).sort()).toEqual(keys(dictionaries.en).sort());
  });

  it("has every admin string translated to Indonesian", () => {
    expect(keys(adminDictionaries.id).sort()).toEqual(keys(adminDictionaries.en).sort());
  });

  it("formats placeholders", () => {
    expect(format("Page {page} of {total}", { page: 2, total: 5 })).toBe("Page 2 of 5");
    expect(format("Hi {name}", {})).toBe("Hi {name}");
  });
});

describe("storeNameFor", () => {
  it("prefers the explicit marketplace, else guesses from the link", () => {
    expect(storeNameFor({ marketplace: "shopee", affiliateUrl: "https://x.com" })).toBe("Shopee");
    expect(storeNameFor({ affiliateUrl: "https://vt.tokopedia.com/t/abc" })).toBe("Tokopedia");
    expect(storeNameFor({ affiliateUrl: "https://example.com/p" })).toBeNull();
    expect(storeNameFor({ affiliateUrl: "not a url" })).toBeNull();
  });
});

describe("allowRateLimitedHit", () => {
  afterEach(() => {
    resetInMemoryRateLimit();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("allows 5 recorded clicks per minute per identity (in-memory)", async () => {
    const results = [];
    for (let i = 0; i < 7; i++) results.push(await allowRateLimitedHit("1.2.3.4:hs-1"));
    expect(results).toEqual([true, true, true, true, true, false, false]);
    expect(await allowRateLimitedHit("5.6.7.8:hs-1")).toBe(true);
  });

  it("uses Upstash when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    const fetchMock = vi.fn(async () => Response.json([{ result: 6 }, { result: 1 }]));
    vi.stubGlobal("fetch", fetchMock);
    expect(await allowRateLimitedHit("ip:hs")).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith("https://example.upstash.io/pipeline", expect.objectContaining({ method: "POST" }));
  });

  it("falls back to in-memory when Upstash is down", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await allowRateLimitedHit("ip:hs")).toBe(true);
  });
});
