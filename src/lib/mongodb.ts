import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

// Offline demo mode (in-memory seed data) is for local development only. In
// production a missing/unreachable database must fail loudly: silently
// serving demo looks to visitors, or accepting admin edits into a memory
// store that vanishes on the next cold start, is worse than an error page.
const allowMemoryFallback =
  process.env.NODE_ENV !== "production" || process.env.ACI_ALLOW_MEMORY_FALLBACK === "1";

declare global {
  var _aciMongoClientPromise: Promise<MongoClient> | undefined;
  var _aciMongoFailedAt: number | undefined;
}

// Dev only: after a failed connection, skip straight to the memory fallback
// for a while instead of making every query on every page wait out the
// connect timeout again (a page runs many queries, so that stacked up to
// a minute or more).
const DEV_RETRY_AFTER_MS = 30_000;

function getClientPromise(): Promise<MongoClient> | null {
  if (!uri) return null;

  if (!global._aciMongoClientPromise) {
    // Serverless cold starts to Atlas routinely take longer than 2s.
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    global._aciMongoClientPromise = client.connect().catch((error) => {
      // Don't cache a failed connection forever — let the next request retry.
      global._aciMongoClientPromise = undefined;
      throw error;
    });
  }
  return global._aciMongoClientPromise;
}

/**
 * Returns a connected Db. In development, returns null when MONGODB_URI is
 * unset or unreachable so callers can fall back to in-memory seed data. In
 * production it throws instead.
 */
export async function getDb(): Promise<Db | null> {
  if (
    allowMemoryFallback &&
    global._aciMongoFailedAt &&
    Date.now() - global._aciMongoFailedAt < DEV_RETRY_AFTER_MS
  ) {
    return null;
  }

  const promise = getClientPromise();
  if (!promise) {
    if (allowMemoryFallback) return null;
    throw new Error("MONGODB_URI is not set. Configure it in your deployment environment.");
  }

  try {
    const client = await promise;
    global._aciMongoFailedAt = undefined;
    return client.db(process.env.MONGODB_DB_NAME || "aci");
  } catch (error) {
    if (!allowMemoryFallback) throw error;
    global._aciMongoFailedAt = Date.now();
    console.warn("[aci] MongoDB unavailable, falling back to seed data:", (error as Error).message);
    return null;
  }
}
