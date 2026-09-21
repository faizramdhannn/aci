export interface PixelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Converts a normalized (0-1) box to pixels for a given rendered size. */
export function normalizedToPixels(
  box: NormalizedBox,
  renderedWidth: number,
  renderedHeight: number
): PixelBox {
  return {
    x: box.x * renderedWidth,
    y: box.y * renderedHeight,
    width: box.width * renderedWidth,
    height: box.height * renderedHeight,
  };
}

/** Converts a pixel box back to normalized (0-1) coordinates for a given rendered size. */
export function pixelsToNormalized(
  box: PixelBox,
  renderedWidth: number,
  renderedHeight: number
): NormalizedBox {
  if (renderedWidth <= 0 || renderedHeight <= 0) {
    throw new Error("renderedWidth and renderedHeight must be greater than 0");
  }
  return {
    x: box.x / renderedWidth,
    y: box.y / renderedHeight,
    width: box.width / renderedWidth,
    height: box.height / renderedHeight,
  };
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
