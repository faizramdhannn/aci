import type { Hotspot, ShoppableImage } from "@/types";

/** A crop region, normalized 0–1 relative to the source image (same convention as hotspot coordinates). */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: { label: string; value: number | null }[] = [
  { label: "Original", value: null },
  { label: "4:5", value: 4 / 5 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "2:3", value: 2 / 3 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
];

export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

/**
 * The largest crop of the given aspect ratio (width/height, in pixels) that
 * fits the image, scaled by `size` (0–1) and centered on (centerX, centerY),
 * clamped to stay inside the image.
 */
export function cropForRatio(
  imageWidth: number,
  imageHeight: number,
  ratio: number | null,
  size = 1,
  centerX = 0.5,
  centerY = 0.5
): CropRect {
  if (ratio === null) return FULL_CROP;
  const imageRatio = imageWidth / imageHeight;
  // Normalized width/height of the biggest box with this ratio.
  let width = ratio < imageRatio ? ratio / imageRatio : 1;
  let height = ratio < imageRatio ? 1 : imageRatio / ratio;
  width *= size;
  height *= size;
  return clampCrop({ x: centerX - width / 2, y: centerY - height / 2, width, height });
}

export function clampCrop(crop: CropRect): CropRect {
  const width = Math.min(1, Math.max(0.01, crop.width));
  const height = Math.min(1, Math.max(0.01, crop.height));
  return {
    x: Math.min(1 - width, Math.max(0, crop.x)),
    y: Math.min(1 - height, Math.max(0, crop.y)),
    width,
    height,
  };
}

export function isFullCrop(crop: CropRect): boolean {
  return crop.x <= 0.001 && crop.y <= 0.001 && crop.width >= 0.999 && crop.height >= 0.999;
}

/** Maps a normalized point on the original image into the cropped image's normalized space. */
export function remapPoint(x: number, y: number, crop: CropRect): { x: number; y: number } {
  return { x: (x - crop.x) / crop.width, y: (y - crop.y) / crop.height };
}

/** Aspect ratio (width/height) of the per-category crops shown in the shop grid. */
export const SHOP_CROP_RATIO = 4 / 5;

/**
 * A crop that frames the given markers (e.g. every product of one category
 * in a look) with some breathing room, at `ratio` in real pixels. Never zooms
 * in tighter than `minSize` of the photo's width, so a single small marker
 * still shows enough context to recognize the outfit.
 */
export function autoCropAround(
  points: { x: number; y: number; width: number; height: number }[],
  imageWidth: number,
  imageHeight: number,
  ratio = SHOP_CROP_RATIO,
  { padding = 0.12, minSize = 0.45 } = {}
): CropRect {
  if (points.length === 0) return cropForRatio(imageWidth, imageHeight, ratio);

  // Bounding box in pixels, including each marker's own size.
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const p of points) {
    const rx = (p.width * imageWidth) / 2;
    const ry = (p.height * imageHeight) / 2;
    left = Math.min(left, p.x * imageWidth - rx);
    right = Math.max(right, p.x * imageWidth + rx);
    top = Math.min(top, p.y * imageHeight - ry);
    bottom = Math.max(bottom, p.y * imageHeight + ry);
  }
  const pad = padding * Math.min(imageWidth, imageHeight);
  let w = right - left + pad * 2;
  let h = bottom - top + pad * 2;
  w = Math.max(w, minSize * imageWidth);

  // Grow the short side to hit the target ratio, then cap at the photo size.
  if (w / h < ratio) w = h * ratio;
  else h = w / ratio;
  const scale = Math.min(1, imageWidth / w, imageHeight / h);
  w *= scale;
  h *= scale;

  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  return clampCrop({
    x: (cx - w / 2) / imageWidth,
    y: (cy - h / 2) / imageHeight,
    width: w / imageWidth,
    height: h / imageHeight,
  });
}

/**
 * CSS for showing only `crop` of a photo inside a box of the same aspect
 * ratio: the photo is scaled up and shifted so the crop fills the box.
 */
export function cropImageStyle(crop: CropRect): {
  width: string;
  height: string;
  left: string;
  top: string;
} {
  return {
    width: `${100 / crop.width}%`,
    height: `${100 / crop.height}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  };
}

/**
 * The crop a look shows for one category in the shop: the admin's saved
 * framing if there is one, otherwise auto-framed around that category's
 * active product markers.
 */
export function shopCropFor(
  image: Pick<ShoppableImage, "_id" | "imageWidth" | "imageHeight" | "categoryCrops">,
  categoryId: string,
  hotspots: Hotspot[]
): CropRect {
  const saved = image.categoryCrops?.[categoryId];
  if (saved) return saved;
  const own = hotspots.filter(
    (h) => h.shoppableImageId === image._id && h.isActive && (h.categoryIds ?? []).includes(categoryId)
  );
  return autoCropAround(own, image.imageWidth, image.imageHeight);
}
