/**
 * A minimal in-memory rate limiter — no Redis/Upstash required, consistent
 * with this project's "works with zero external services" approach. It
 * only guards against a single client hammering the same hotspot to
 * inflate click analytics; it does not block the affiliate redirect itself.
 *
 * Known limitation: state is per server instance/lambda, so on serverless
 * it resets between cold starts and isn't shared across concurrent
 * instances. Good enough to stop casual spam/bots; not a substitute for a
 * shared store (e.g. Upstash) if you need airtight protection at scale.
 */
const WINDOW_MS = 60_000;
const MAX_HITS_PER_WINDOW = 5;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = 0;

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Returns true if this identity is still under the limit (and counts this hit), false if it should be throttled. */
export function allowRateLimitedHit(identity: string): boolean {
  const now = Date.now();
  if (now - lastCleanup > WINDOW_MS) {
    cleanup(now);
    lastCleanup = now;
  }

  const bucket = buckets.get(identity);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(identity, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_HITS_PER_WINDOW) return false;
  bucket.count += 1;
  return true;
}
