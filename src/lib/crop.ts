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
