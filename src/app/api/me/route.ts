import { NextResponse } from "next/server";
import { auth, isAdminSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/store/customers";

/**
 * The signed-in account, for cached pages that personalise in the browser
 * (header name, cart, wishlist, admin bar). Only requested when the
 * narras_auth hint cookie says someone is signed in.
 */
export async function GET() {
  const session = await auth();
  const customer = session?.customerId ? await getCustomerById(session.customerId) : null;
  if (!session || !customer) {
    return NextResponse.json({ signedIn: false }, { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json(
    {
      signedIn: true,
      isAdmin: isAdminSession(session),
      email: customer.email,
      name: customer.name,
      cart: customer.cart ?? [],
      wishlist: customer.wishlist ?? [],
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
