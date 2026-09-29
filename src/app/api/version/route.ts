import { NextResponse } from "next/server";
import { getContentVersion } from "@/lib/content-version";

export const dynamic = "force-dynamic";

/** Polled by open pages. Cached briefly at the edge so many visitors cost one database check per few seconds. */
export async function GET() {
  return NextResponse.json(
    { v: await getContentVersion() },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=10" } }
  );
}
