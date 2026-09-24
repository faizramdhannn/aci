/**
 * WIPES and re-seeds MongoDB (MONGODB_URI) with the demo data the app falls
 * back to in-memory. Destructive: never run this against a database that
 * holds real looks. To only (re)create indexes, use `npm run db:indexes`.
 *
 * Usage: npm run seed -- --yes-wipe-everything
 */
import { config } from "dotenv";
import { MongoClient, type Document } from "mongodb";

config({ path: ".env.local" });
import { ensureIndexes } from "./ensure-indexes";
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

  if (!process.argv.includes("--yes-wipe-everything")) {
    console.error(
      "This deletes ALL looks, hotspots, categories, and analytics in the target database before seeding demo data.\n" +
        "Re-run with: npm run seed -- --yes-wipe-everything"
    );
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
    db.collection("annotations").deleteMany({}),
  ]);

  await db.collection("categories").insertMany(seedCategories as unknown as Document[]);
  await db.collection("shoppableImages").insertMany(seedShoppableImages as unknown as Document[]);
  await db.collection("hotspots").insertMany(seedHotspots as unknown as Document[]);
  if (seedViewEvents.length) await db.collection("viewEvents").insertMany(seedViewEvents as unknown as Document[]);
  if (seedClickEvents.length) await db.collection("clickEvents").insertMany(seedClickEvents as unknown as Document[]);

  await ensureIndexes(db);

  console.log(
    `Seeded ${seedCategories.length} categories, ${seedShoppableImages.length} shoppable images, ${seedHotspots.length} hotspots.`
  );

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
