/**
 * Creates every MongoDB index the app relies on. Idempotent and
 * non-destructive (createIndex is a no-op when the index already exists), so
 * it's safe to run against production any time — unlike `npm run seed`,
 * which wipes data.
 *
 * Usage: npm run db:indexes
 */
import { config } from "dotenv";
import { MongoClient, type Db } from "mongodb";

config({ path: ".env.local" });

const retentionDays = Number(process.env.ANALYTICS_RETENTION_DAYS) || 365;

/** Old view/click events expire automatically after ANALYTICS_RETENTION_DAYS (default 365). */
async function ensureTtlIndex(db: Db, collection: string) {
  const expireAfterSeconds = retentionDays * 24 * 60 * 60;
  try {
    await db.collection(collection).createIndex({ ts: 1 }, { name: "ts_ttl", expireAfterSeconds });
  } catch (error) {
    // Already exists with a different retention — update it in place.
    if ((error as { codeName?: string }).codeName !== "IndexOptionsConflict") throw error;
    await db.command({ collMod: collection, index: { name: "ts_ttl", expireAfterSeconds } });
  }
}

export async function ensureIndexes(db: Db) {
  const dupes = await db
    .collection("shoppableImages")
    .aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }])
    .toArray();
  if (dupes.length > 0) {
    throw new Error(
      `Can't create the unique slug index: duplicate slugs exist (${dupes.map((d) => d._id).join(", ")}). ` +
        "Rename one of each pair in the admin first."
    );
  }

  // Backfill ts (BSON Date) on events recorded before it existed, so the TTL
  // index below can expire them too. Idempotent: only touches docs without ts.
  for (const name of ["viewEvents", "clickEvents"]) {
    await db
      .collection(name)
      .updateMany({ ts: { $exists: false } }, [{ $set: { ts: { $toDate: "$createdAt" } } }]);
    await ensureTtlIndex(db, name);
  }

  await Promise.all([
    db.collection("shoppableImages").createIndex({ slug: 1 }, { unique: true }),
    db.collection("shoppableImages").createIndex({ status: 1, createdAt: -1 }),
    db.collection("hotspots").createIndex({ shoppableImageId: 1 }),
    db.collection("hotspots").createIndex({ categoryIds: 1 }),
    db.collection("annotations").createIndex({ shoppableImageId: 1 }),
    db.collection("clickEvents").createIndex({ shoppableImageId: 1 }),
    db.collection("clickEvents").createIndex({ hotspotId: 1 }),
    db.collection("clickEvents").createIndex({ createdAt: 1 }),
    db.collection("viewEvents").createIndex({ shoppableImageId: 1 }),
    db.collection("viewEvents").createIndex({ createdAt: 1 }),
    db.collection("categories").createIndex({ sortOrder: 1 }),
  ]);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local first — see .env.example.");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  try {
    await ensureIndexes(client.db(process.env.MONGODB_DB_NAME || "aci"));
    console.log(`Indexes are up to date. Analytics events expire after ${retentionDays} days.`);
  } finally {
    await client.close();
  }
}

if (process.argv[1]?.endsWith("ensure-indexes.ts")) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
