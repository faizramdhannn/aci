/**
 * Seeds MongoDB (MONGODB_URI) with the same demo data the app falls back to
 * in-memory. Run after pointing the app at a real MongoDB instance, so the
 * data actually persists across restarts.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import { MongoClient, type Document } from "mongodb";
import {
  seedCategories,
  seedClickEvents,
  seedHotspots,
  seedShoppableImages,
  seedViewEvents,
} from "../src/lib/seed-data";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local first — see .env.example.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "aci");

  await Promise.all([
    db.collection("categories").deleteMany({}),
    db.collection("shoppableImages").deleteMany({}),
    db.collection("hotspots").deleteMany({}),
    db.collection("viewEvents").deleteMany({}),
    db.collection("clickEvents").deleteMany({}),
  ]);

  await db.collection("categories").insertMany(seedCategories as unknown as Document[]);
  await db.collection("shoppableImages").insertMany(seedShoppableImages as unknown as Document[]);
  await db.collection("hotspots").insertMany(seedHotspots as unknown as Document[]);
  if (seedViewEvents.length) await db.collection("viewEvents").insertMany(seedViewEvents as unknown as Document[]);
  if (seedClickEvents.length) await db.collection("clickEvents").insertMany(seedClickEvents as unknown as Document[]);

  await db.collection("hotspots").createIndex({ shoppableImageId: 1 });
  await db.collection("clickEvents").createIndex({ hotspotId: 1 });
  await db.collection("clickEvents").createIndex({ createdAt: 1 });
  await db.collection("viewEvents").createIndex({ shoppableImageId: 1 });
  await db.collection("viewEvents").createIndex({ createdAt: 1 });

  console.log(
    `Seeded ${seedCategories.length} categories, ${seedShoppableImages.length} shoppable images, ${seedHotspots.length} hotspots.`
  );

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
