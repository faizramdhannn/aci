import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { uploadImage, UploadValidationError } from "@/lib/storage";
import { importImageFromUrl, ImportUrlError } from "@/lib/import-from-url";

const bodySchema = z.object({ url: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "A URL is required." }, { status: 400 });

  try {
    const { file } = await importImageFromUrl(parsed.data.url);
    const { url } = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ImportUrlError || error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[aci] import from URL failed:", error);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
