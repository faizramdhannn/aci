import { NextResponse } from "next/server";
import { adminSession } from "@/lib/auth";
import { orderPatchSchema } from "@/lib/store/schemas";
import { OrderError, updateOrder } from "@/lib/store/data";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = orderPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { shippingCost, ...rest } = parsed.data;
  try {
    const order = await updateOrder(id, {
      ...rest,
      ...(shippingCost !== undefined ? { shippingCost: shippingCost ?? undefined } : {}),
    });
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.code }, { status: error.code === "unavailable" ? 404 : 409 });
    }
    throw error;
  }
}
