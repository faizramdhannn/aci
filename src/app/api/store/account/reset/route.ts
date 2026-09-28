import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordSchema } from "@/lib/store/account-schemas";
import { CustomerError, resetPassword } from "@/lib/store/customers";

export async function POST(request: Request) {
  const parsed = z
    .object({ token: z.string().min(20).max(200), password: passwordSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CustomerError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
