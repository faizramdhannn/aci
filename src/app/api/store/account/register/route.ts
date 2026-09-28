import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/store/account-schemas";
import { CustomerError, registerCustomer } from "@/lib/store/customers";
import { allowRateLimitedHit } from "@/lib/rate-limit";

/** Creates an account; the client then signs in with the "customer" provider. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allowRateLimitedHit(ip, { scope: "register", max: 5 }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") }, { status: 400 });
  }
  try {
    await registerCustomer(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerError) return NextResponse.json({ error: error.code }, { status: 409 });
    throw error;
  }
}
