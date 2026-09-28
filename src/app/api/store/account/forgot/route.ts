import { NextResponse } from "next/server";
import { z } from "zod";
import { createResetToken, getCustomerByEmail } from "@/lib/store/customers";
import { getStoreSettings } from "@/lib/store/data";
import { resetPasswordEmail, sendEmail } from "@/lib/email";
import { allowRateLimitedHit } from "@/lib/rate-limit";

/**
 * Emails a one-hour reset link. Always answers the same way whether or not
 * the email has an account, so the form can't be used to discover accounts.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allowRateLimitedHit(ip, { scope: "forgot", max: 3 }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = z.object({ email: z.string().trim().email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const customer = await getCustomerByEmail(parsed.data.email);
  if (customer) {
    const token = await createResetToken(customer._id);
    const link = `${new URL(request.url).origin}/narras/reset-password?token=${token}`;
    const { storeName } = await getStoreSettings();
    try {
      await sendEmail({ to: customer.email, ...resetPasswordEmail({ name: customer.name, link, store: storeName }) });
    } catch (error) {
      console.error("[aci] reset email failed:", error);
      return NextResponse.json({ error: "email_failed" }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}
