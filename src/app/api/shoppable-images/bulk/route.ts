import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteShoppableImage, updateShoppableImage } from "@/lib/data";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["publish", "draft", "delete"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { ids, action } = parsed.data;

  if (action === "delete") {
    await Promise.all(ids.map((id) => deleteShoppableImage(id)));
  } else {
    const status = action === "publish" ? "published" : "draft";
    await Promise.all(ids.map((id) => updateShoppableImage(id, { status })));
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
