import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getShoppableImageById, reframeShoppableImage } from "@/lib/data";
import { uploadImage } from "@/lib/storage";
import { isFullCrop } from "@/lib/crop";

const MAX_DIMENSION = 1600;

const bodySchema = z.object({
  crop: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().gt(0).max(1),
      height: z.number().gt(0).max(1),
    })
    .refine((c) => c.x + c.width <= 1.0001 && c.y + c.height <= 1.0001, "Crop must stay inside the photo"),
});

async function readSourceImage(imageUrl: string, requestUrl: string): Promise<Buffer> {
  if (/^https?:\/\//.test(imageUrl)) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Couldn't download the current photo (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  // Local uploads / seed assets live under public/. Resolve and make sure the
  // path can't escape that directory.
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.resolve(publicDir, "." + new URL(imageUrl, requestUrl).pathname);
  if (!filePath.startsWith(publicDir + path.sep)) throw new Error("Invalid image path");
  return readFile(filePath);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const image = await getShoppableImageById(id);
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid crop." }, { status: 400 });
  const { crop } = parsed.data;
  if (isFullCrop(crop)) return NextResponse.json({ ok: true, outside: 0 });

  try {
    // .rotate() applies EXIF orientation first, so the crop lines up with the
    // photo exactly as the browser displayed it in the cropper.
    const oriented = await sharp(await readSourceImage(image.imageUrl, request.url))
      .rotate()
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = oriented.info;

    const left = Math.round(crop.x * w);
    const top = Math.round(crop.y * h);
    const cropped = await sharp(oriented.data)
      .extract({
        left,
        top,
        width: Math.min(w - left, Math.max(1, Math.round(crop.width * w))),
        height: Math.min(h - top, Math.max(1, Math.round(crop.height * h))),
      })
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    const file = new File([new Uint8Array(cropped.data)], `crop-${id}.jpg`, { type: "image/jpeg" });
    const { url } = await uploadImage(file);
    const { outside } = await reframeShoppableImage(id, crop, {
      imageUrl: url,
      imageWidth: cropped.info.width,
      imageHeight: cropped.info.height,
    });
    return NextResponse.json({ ok: true, outside });
  } catch (error) {
    console.error("[aci] crop failed:", error);
    return NextResponse.json({ error: "Couldn't crop this photo." }, { status: 500 });
  }
}
