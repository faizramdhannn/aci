import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getHotspotById, recordClick } from "@/lib/data";
import { parseUserAgent } from "@/lib/user-agent";

const SESSION_COOKIE = "aci_session";

function isSafeAffiliateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ hotspotId: string }> }) {
  const { hotspotId } = await params;
  const hotspot = await getHotspotById(hotspotId);

  if (!hotspot || !hotspot.isActive || !isSafeAffiliateUrl(hotspot.affiliateUrl)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  const { deviceType, browser, os } = parseUserAgent(request.headers.get("user-agent"));
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();

  // cx/cy is the real click position (normalized 0-1 on the photo), sent by
  // the storefront's click handler — used for a true per-pixel heatmap
  // instead of bucketing every click onto the hotspot's own position.
  const cx = Number(request.nextUrl.searchParams.get("cx"));
  const cy = Number(request.nextUrl.searchParams.get("cy"));
  const hasClickPosition = Number.isFinite(cx) && Number.isFinite(cy) && cx >= 0 && cx <= 1 && cy >= 0 && cy <= 1;

  await recordClick({
    hotspotId: hotspot._id,
    shoppableImageId: hotspot.shoppableImageId,
    ownerId: hotspot.ownerId,
    sessionId,
    deviceType,
    browser,
    os,
    viewportWidth: 0,
    viewportHeight: 0,
    referrer: request.headers.get("referer") ?? undefined,
    ...(hasClickPosition ? { clickX: cx, clickY: cy } : {}),
  });

  const response = NextResponse.redirect(hotspot.affiliateUrl, { status: 302 });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
