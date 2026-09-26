/**
 * Guards against a single client hammering the same hotspot to inflate
 * click analytics. It never blocks the affiliate redirect itself — callers
 * only skip *recording* the click when this returns false.
 *
 * With UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN set, counts live in
 * Upstash Redis (via its REST API — no extra dependency), so the limit holds
 * across every serverless instance and survives cold starts. Without them,
 * or if Redis is unreachable, it falls back to a per-instance in-memory
 * counter, which still stops casual spam.
 */
const WINDOW_SECONDS = 60;
const MAX_HITS_PER_WINDOW = 5;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = 0;

function allowInMemory(identity: string, now = Date.now()): boolean {
  if (now - lastCleanup > WINDOW_SECONDS * 1000) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
    lastCleanup = now;
  }
  const bucket = buckets.get(identity);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(identity, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return true;
  }
  if (bucket.count >= MAX_HITS_PER_WINDOW) return false;
  bucket.count += 1;
  return true;
}

async function allowInRedis(identity: string, url: string, token: string): Promise<boolean> {
  const key = `aci:click:${identity}`;
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    // INCR then start the window only on the first hit (NX), atomically in one round trip.
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(WINDOW_SECONDS), "NX"],
    ]),
    signal: AbortSignal.timeout(1500),
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const [incr] = (await res.json()) as [{ result?: number; error?: string }];
  if (typeof incr?.result !== "number") throw new Error(incr?.error ?? "Unexpected Upstash response");
  return incr.result <= MAX_HITS_PER_WINDOW;
}

/** True if this identity is under the limit (and counts this hit), false if it should be throttled. */
export async function allowRateLimitedHit(identity: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return await allowInRedis(identity, url, token);
    } catch (error) {
      console.warn("[aci] rate limiter: Redis unavailable, using in-memory fallback:", (error as Error).message);
    }
  }
  return allowInMemory(identity);
}

/** Test hook: clears the in-memory counters. */
export function resetInMemoryRateLimit() {
  buckets.clear();
  lastCleanup = 0;
}
