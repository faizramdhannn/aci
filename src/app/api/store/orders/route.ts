import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/store/schemas";
import { getStoreSettings, OrderError, placeOrder } from "@/lib/store/data";
import { orderMessage, whatsappLink } from "@/lib/store/whatsapp";
import { allowRateLimitedHit } from "@/lib/rate-limit";
import { customerId } from "@/lib/auth";
import { setCart } from "@/lib/store/customers";
import { withRevalidate } from "@/lib/revalidate";

/** Checkout for signed-in customers: records the order, reserves stock, and returns the WhatsApp link to send it. */
async function handlePOST(request: Request) {
  const buyer = await customerId();
  if (!buyer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allowRateLimitedHit(ip, { scope: "order", max: 5 }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.at(-1);
    return NextResponse.json({ error: "invalid", field: field ? String(field) : undefined }, { status: 400 });
  }

  try {
    const order = await placeOrder({ ...parsed.data, customerId: buyer });
    await setCart(buyer, []);
    const settings = await getStoreSettings();
    const orderUrl = `${new URL(request.url).origin}/narras/order/${order._id}`;
    const whatsappUrl = settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, orderMessage(order, orderUrl)) : null;
    return NextResponse.json({ id: order._id, number: order.number, whatsappUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.code, ...error.detail }, { status: 409 });
    }
    throw error;
  }
}

export const POST = withRevalidate(handlePOST);
