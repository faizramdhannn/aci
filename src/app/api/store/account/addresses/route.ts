import { NextResponse } from "next/server";
import { customerId } from "@/lib/auth";
import { addressSchema } from "@/lib/store/account-schemas";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/store/customers";

/** Add or edit (with id) an address. */
export async function POST(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") }, { status: 400 });
  }
  const { makeDefault, ...address } = parsed.data;
  const saved = await saveAddress(id, address, Boolean(makeDefault));
  return NextResponse.json(saved);
}

/** ?id=…&default=1 makes it the default. */
export async function PATCH(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const addressId = new URL(request.url).searchParams.get("id");
  if (!addressId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await setDefaultAddress(id, addressId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const addressId = new URL(request.url).searchParams.get("id");
  if (!addressId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await deleteAddress(id, addressId);
  return NextResponse.json({ ok: true });
}
