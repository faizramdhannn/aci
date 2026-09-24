const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/**
 * Downscales an oversized photo (e.g. a 12MP+ phone camera shot) to a
 * reasonable max dimension before it's uploaded — faster uploads, less
 * storage, and lighter pages for everyone viewing the look afterward.
 * Skips GIFs (would break animation) and anything already small enough.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  let dataUrl: string;
  try {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't decode image"));
      el.src = dataUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale >= 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, JPEG_QUALITY));
    if (!blob) return file;

    return new File([blob], file.name, { type: outputType });
  } catch {
    // Compression is a nice-to-have, never a hard requirement — fall back
    // to the original file rather than blocking the upload.
    return file;
  }
}
