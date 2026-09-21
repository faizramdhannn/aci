import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { recordView, getShoppableImageById } from "@/lib/data";
import { parseUserAgent } from "@/lib/user-agent";

const bodySchema = z.object({
  shoppableImageId: z.string().min(1),
  viewportWidth: z.number().int().positive(),
  viewportHeight: z.number().int().positive(),
  referrer: z.string().optional(),
});

const SESSION_COOKIE = "aci_session";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const image = await getShoppableImageById(parsed.data.shoppableImageId);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { deviceType, browser, os } = parseUserAgent(request.headers.get("user-agent"));
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();

  await recordView({
    shoppableImageId: image._id,
    ownerId: image.ownerId,
    sessionId,
    deviceType,
    browser,
    os,
    viewportWidth: parsed.data.viewportWidth,
    viewportHeight: parsed.data.viewportHeight,
    referrer: parsed.data.referrer,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
