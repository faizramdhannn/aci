import { describe, expect, it } from "vitest";
import { clampCrop, cropForRatio, isFullCrop, remapPoint } from "@/lib/crop";

describe("cropForRatio", () => {
  it("returns the full frame for the original ratio", () => {
    expect(isFullCrop(cropForRatio(1000, 1500, null))).toBe(true);
  });

  it("fits a 1:1 crop to the short side of a portrait photo, centered", () => {
    const c = cropForRatio(1000, 1500, 1);
    expect(c.width).toBeCloseTo(1);
    expect(c.height).toBeCloseTo(1000 / 1500);
    expect(c.y).toBeCloseTo((1 - 1000 / 1500) / 2);
    // Result really is square in pixels.
    expect((c.width * 1000) / (c.height * 1500)).toBeCloseTo(1);
  });

  it("fits a 4:5 crop inside a landscape photo", () => {
    const c = cropForRatio(1600, 900, 4 / 5);
    expect(c.height).toBeCloseTo(1);
    expect((c.width * 1600) / (c.height * 900)).toBeCloseTo(4 / 5);
  });

  it("keeps a zoomed crop inside the photo even when centered at an edge", () => {
    const c = cropForRatio(1000, 1000, 1, 0.5, 0.95, 0.05);
    expect(c.x + c.width).toBeLessThanOrEqual(1);
    expect(c.y).toBeGreaterThanOrEqual(0);
  });
});

describe("clampCrop", () => {
  it("pulls an out-of-bounds crop back inside", () => {
    expect(clampCrop({ x: 0.8, y: -0.2, width: 0.5, height: 0.5 })).toEqual({ x: 0.5, y: 0, width: 0.5, height: 0.5 });
  });
});

describe("remapPoint", () => {
  it("maps points into the cropped frame", () => {
    const crop = { x: 0.25, y: 0.1, width: 0.5, height: 0.8 };
    expect(remapPoint(0.25, 0.1, crop)).toEqual({ x: 0, y: 0 });
    expect(remapPoint(0.5, 0.5, crop)).toEqual({ x: 0.5, y: 0.5 });
    expect(remapPoint(0.75, 0.9, crop).x).toBeCloseTo(1);
  });
});

import { autoCropAround, SHOP_CROP_RATIO } from "@/lib/crop";

describe("autoCropAround", () => {
  const W = 1000;
  const H = 1500;
  const pixelRatio = (c: { width: number; height: number }) => (c.width * W) / (c.height * H);

  it("frames the markers at the shop ratio, inside the photo", () => {
    const c = autoCropAround([{ x: 0.5, y: 0.8, width: 0.05, height: 0.05 }], W, H);
    expect(pixelRatio(c)).toBeCloseTo(SHOP_CROP_RATIO, 5);
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.y + c.height).toBeLessThanOrEqual(1 + 1e-9);
    // The marker stays inside the frame.
    expect(0.8).toBeGreaterThan(c.y);
    expect(0.8).toBeLessThan(c.y + c.height);
  });

  it("widens to cover markers that are far apart", () => {
    const c = autoCropAround(
      [
        { x: 0.2, y: 0.3, width: 0.04, height: 0.04 },
        { x: 0.8, y: 0.35, width: 0.04, height: 0.04 },
      ],
      W,
      H
    );
    expect(c.x).toBeLessThan(0.2);
    expect(c.x + c.width).toBeGreaterThan(0.8);
  });

  it("falls back to a centered crop with no markers", () => {
    const c = autoCropAround([], W, H);
    expect(pixelRatio(c)).toBeCloseTo(SHOP_CROP_RATIO, 5);
  });
});
