import { NextResponse } from "next/server";
import { customerId } from "@/lib/auth";
import { cartSchema } from "@/lib/store/account-schemas";
import { getCustomerById, setCart } from "@/lib/store/customers";

export async function GET() {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json((await getCustomerById(id))?.cart ?? []);
}

/** Replaces the whole cart (the client keeps it and saves after each change). */
export async function PUT(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = cartSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await setCart(id, parsed.data);
  return NextResponse.json({ ok: true });
}
