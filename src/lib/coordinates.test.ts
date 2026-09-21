import { describe, expect, it } from "vitest";
import { normalizedToPixels, pixelsToNormalized, clamp01 } from "@/lib/coordinates";

describe("normalizedToPixels", () => {
  it("scales a normalized box to the rendered size", () => {
    const px = normalizedToPixels({ x: 0.72, y: 0.35, width: 0.08, height: 0.08 }, 390, 585);
    expect(px.x).toBeCloseTo(280.8);
    expect(px.y).toBeCloseTo(204.75);
    expect(px.width).toBeCloseTo(31.2);
    expect(px.height).toBeCloseTo(46.8);
  });
});

describe("pixelsToNormalized", () => {
  it("is the inverse of normalizedToPixels", () => {
    const original = { x: 0.72, y: 0.35, width: 0.08, height: 0.08 };
    const px = normalizedToPixels(original, 390, 585);
    const back = pixelsToNormalized(px, 390, 585);
    expect(back.x).toBeCloseTo(original.x);
    expect(back.y).toBeCloseTo(original.y);
  });

  it("throws for a zero-size render target", () => {
    expect(() => pixelsToNormalized({ x: 0, y: 0, width: 0, height: 0 }, 0, 0)).toThrow();
  });
});

describe("clamp01", () => {
  it("clamps values to the 0-1 range", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(0.42)).toBe(0.42);
  });
});
