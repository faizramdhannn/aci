import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { isSuperadminEmail } from "@/config/admins";
import { getCustomerById, setCustomerRole } from "@/lib/store/customers";

/** Admin: change an account's role. Superadmins are fixed; you can't demote yourself. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ role: z.enum(["customer", "admin"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (isSuperadminEmail(customer.email) || customer._id === session.customerId) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  await setCustomerRole(id, parsed.data.role);
  return NextResponse.json({ ok: true });
}
