import { FULL_CROP, isFullCrop, type CropRect } from "@/lib/crop";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't decode image"));
    };
    img.src = url;
  });
}

/**
 * Crops (optionally) and downscales a photo in the browser before upload, so
 * a 12MP+ phone shot doesn't become a slow upload or a heavy page. GIFs are
 * passed through untouched (re-encoding would drop the animation), and a
 * full-frame photo already under the size cap isn't re-encoded at all.
 * Never blocks the upload: any failure falls back to the original file.
 */
export async function prepareImage(file: File, crop: CropRect = FULL_CROP): Promise<File> {
  if (file.type === "image/gif") return file;

  try {
    const img = await loadImage(file);
    const sx = crop.x * img.naturalWidth;
    const sy = crop.y * img.naturalHeight;
    const sw = crop.width * img.naturalWidth;
    const sh = crop.height * img.naturalHeight;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(sw, sh));
    if (scale >= 1 && isFullCrop(crop)) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, JPEG_QUALITY));
    if (!blob) return file;

    return new File([blob], file.name, { type: outputType });
  } catch {
    return file;
  }
}
