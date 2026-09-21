import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
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
