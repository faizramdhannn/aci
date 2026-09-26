import { beforeEach, describe, expect, it, vi } from "vitest";

// Exercises the data layer against the in-memory store (MONGODB_URI is unset
// under vitest), which shares its logic and contracts with the Mongo path.
vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import { deleteStoredImage } from "@/lib/storage";
import {
  deleteShoppableImage,
  duplicateShoppableImage,
  generateUniqueSlug,
  getShoppableImageById,
  listAnnotationsForImage,
  listFeaturedImages,
  listHotspotsForImage,
  listPublishedImagesExcluding,
  listPublishedImagesPage,
  reframeShoppableImage,
  searchContent,
  updateShoppableImage,
  upsertAnnotation,
  upsertHotspot,
} from "@/lib/data";
import { getMemoryStore } from "@/lib/memory-store";

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
  vi.mocked(deleteStoredImage).mockClear();
});

describe("generateUniqueSlug", () => {
  it("returns the plain slug when free and suffixes it when taken", async () => {
    expect(await generateUniqueSlug("Brand New Look!")).toBe("brand-new-look");
    expect(await generateUniqueSlug("Golden hour")).toBe("golden-hour-2");
  });

  it("lets a look keep its own slug", async () => {
    expect(await generateUniqueSlug("Golden hour", "img-golden-hour")).toBe("golden-hour");
  });
});

describe("listPublishedImagesPage", () => {
  it("paginates published looks newest first", async () => {
    const page1 = await listPublishedImagesPage({ page: 1, pageSize: 1 });
    expect(page1.totalPages).toBe(2);
    expect(page1.items.map((i) => i._id)).toEqual(["img-golden-hour"]);
    const page2 = await listPublishedImagesPage({ page: 2, pageSize: 1 });
    expect(page2.items.map((i) => i._id)).toEqual(["img-cream-hijab"]);
  });

  it("clamps an out-of-range page", async () => {
    expect((await listPublishedImagesPage({ page: 99, pageSize: 1 })).page).toBe(2);
  });

  it("hides drafts", async () => {
    await updateShoppableImage("img-golden-hour", { status: "draft" });
    const { items } = await listPublishedImagesPage({ page: 1, pageSize: 10 });
    expect(items.map((i) => i._id)).toEqual(["img-cream-hijab"]);
  });

  it("matches a category through a product even when the look itself isn't tagged", async () => {
    const [hotspot] = await listHotspotsForImage("img-cream-hijab");
    await upsertHotspot({ ...hotspot, categoryIds: ["cat-bags"] });
    const { items } = await listPublishedImagesPage({ page: 1, pageSize: 10, categoryId: "cat-bags" });
    expect(items.map((i) => i._id)).toEqual(["img-cream-hijab"]);
  });
});

describe("homepage selection", () => {
  it("features the newest look until any is marked featured, and the grid never repeats it", async () => {
    const featured = await listFeaturedImages();
    expect(featured.map((i) => i._id)).toEqual(["img-golden-hour"]);
    const rest = await listPublishedImagesExcluding(featured.map((i) => i._id), 8);
    expect(rest.map((i) => i._id)).toEqual(["img-cream-hijab"]);

    await updateShoppableImage("img-cream-hijab", { featured: true });
    expect((await listFeaturedImages()).map((i) => i._id)).toEqual(["img-cream-hijab"]);
  });
});

describe("duplicateShoppableImage", () => {
  it("copies the look as a draft with its hotspots, under a unique slug", async () => {
    const copy = await duplicateShoppableImage("img-golden-hour");
    expect(copy).not.toBeNull();
    expect(copy!.status).toBe("draft");
    expect(copy!.featured).toBe(false);
    expect(copy!.slug).not.toBe("golden-hour");
    const [originalHotspots, copiedHotspots] = await Promise.all([
      listHotspotsForImage("img-golden-hour"),
      listHotspotsForImage(copy!._id),
    ]);
    expect(copiedHotspots).toHaveLength(originalHotspots.length);
    expect(copiedHotspots.map((h) => h._id)).not.toContain(originalHotspots[0]._id);
  });
});

describe("deleteShoppableImage", () => {
  it("removes the look with its hotspots and annotations", async () => {
    await deleteShoppableImage("img-golden-hour");
    expect(await getShoppableImageById("img-golden-hour")).toBeNull();
    expect(await listHotspotsForImage("img-golden-hour")).toHaveLength(0);
  });

  it("deletes the photo file only once no other look uses it", async () => {
    const copy = await duplicateShoppableImage("img-golden-hour");
    await deleteShoppableImage("img-golden-hour");
    expect(deleteStoredImage).not.toHaveBeenCalled(); // the copy still shows it
    await deleteShoppableImage(copy!._id);
    expect(deleteStoredImage).toHaveBeenCalledWith(copy!.imageUrl);
  });
});

describe("reframeShoppableImage", () => {
  it("moves markers into the cropped frame and reports ones that fell outside", async () => {
    await upsertAnnotation({
      _id: "ann-1",
      shoppableImageId: "img-golden-hour",
      ownerId: "o",
      kind: "text",
      text: "hi",
      fontFamily: "Manrope",
      fontSize: 0.05,
      color: "#000",
      rotation: 0,
      x: 0.5,
      y: 0.5,
      createdAt: "",
      updatedAt: "",
    });
    const before = await listHotspotsForImage("img-golden-hour");
    // Keep the middle half vertically: y 0.25–0.75.
    const crop = { x: 0, y: 0.25, width: 1, height: 0.5 };
    const { outside } = await reframeShoppableImage("img-golden-hour", crop, {
      imageUrl: "/uploads/new.jpg",
      imageWidth: 900,
      imageHeight: 675,
    });

    const after = await listHotspotsForImage("img-golden-hour");
    for (const h of before) {
      const moved = after.find((a) => a._id === h._id)!;
      const expectedY = Math.min(1, Math.max(0, (h.y - 0.25) / 0.5));
      expect(moved.y).toBeCloseTo(expectedY);
      expect(moved.x).toBeCloseTo(h.x);
    }
    expect(outside).toBe(before.filter((h) => h.y < 0.25 || h.y > 0.75).length);

    const [text] = await listAnnotationsForImage("img-golden-hour");
    expect(text.y).toBeCloseTo(0.5);
    expect((await getShoppableImageById("img-golden-hour"))!.imageUrl).toBe("/uploads/new.jpg");
    expect(deleteStoredImage).toHaveBeenCalled();
  });
});

describe("searchContent", () => {
  it("finds a look by a misspelled product name", async () => {
    const { images } = await searchContent("wtach"); // "Minimal Watch"
    expect(images.map((i) => i._id)).toContain("img-golden-hour");
  });

  it("never returns drafts", async () => {
    await updateShoppableImage("img-golden-hour", { status: "draft" });
    expect((await searchContent("golden")).images).toHaveLength(0);
  });

  it("returns nothing for unrelated text", async () => {
    expect((await searchContent("zzqqxx")).images).toHaveLength(0);
  });
});

it("memory store resets between tests", () => {
  expect(getMemoryStore().images).toHaveLength(2);
});
