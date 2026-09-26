import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadValidationError extends Error {}

/**
 * Uploads an image and returns its public URL.
 *
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is configured. Otherwise
 * writes to public/uploads/ so file uploads work on a fresh local
 * checkout with zero external services — fine for development, not for
 * a production deployment on serverless (ephemeral filesystem).
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadValidationError("Only JPEG, PNG, WEBP, or GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadValidationError("Image is larger than 8MB.");
  }

  const ext = EXT_BY_TYPE[file.type];
  const filename = `${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return { url: `/uploads/${filename}` };
}

/**
 * Deletes a file previously returned by uploadImage. Only touches files this
 * app owns — Vercel Blob URLs and /uploads/ paths; seed assets and anything
 * else are left alone. Best-effort: failures are logged, never thrown, since
 * a leftover file is harmless and must not break the edit that triggered it.
 */
export async function deleteStoredImage(url: string): Promise<void> {
  try {
    if (/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) return;
      const { del } = await import("@vercel/blob");
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return;
    }
    const match = url.match(/^\/uploads\/([\w-]+\.(?:jpg|png|webp|gif))$/);
    if (match) await unlink(path.join(process.cwd(), "public", "uploads", match[1]));
  } catch (error) {
    console.warn("[aci] couldn't delete old image:", url, (error as Error).message);
  }
}
