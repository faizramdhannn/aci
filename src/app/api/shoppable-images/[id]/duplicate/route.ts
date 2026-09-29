import { NextResponse } from "next/server";
import { adminSession } from "@/lib/auth";
import { duplicateShoppableImage } from "@/lib/data";
import { withRevalidate } from "@/lib/revalidate";

async function handlePOST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const copy = await duplicateShoppableImage(id);
  if (!copy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(copy, { status: 201 });
}

export const POST = withRevalidate(handlePOST);
