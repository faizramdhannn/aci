import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage, UploadValidationError } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const { url } = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[aci] upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
