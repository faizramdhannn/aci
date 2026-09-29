import { createHash } from "crypto";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";

/**
 * A short fingerprint of everything visitors see. It changes whenever the
 * admin creates, edits or deletes content, so open pages can tell they're
 * stale and refresh themselves (see LiveRefresh). Large collections
 * contribute their count + latest updatedAt; small ones their full contents.
 */
const TRACKED = ["storeProducts", "shoppableImages", "hotspots", "annotations"] as const;
const SMALL = ["settings", "categories", "storeCollections"] as const;

export async function getContentVersion(): Promise<string> {
  const hash = createHash("sha1");
  const db = await getDb();
  if (!db) {
    const s = getMemoryStore();
    hash.update(
      JSON.stringify([s.storeProducts, s.images, s.hotspots, s.annotations, s.settings, s.storeSettings, s.hubSettings, s.categories, s.storeCollections])
    );
    return hash.digest("hex").slice(0, 16);
  }
  const parts = await Promise.all([
    ...TRACKED.map(async (name) => {
      const col = db.collection<{ updatedAt?: string }>(name);
      const [count, latest] = await Promise.all([
        col.estimatedDocumentCount(),
        col.find({}, { projection: { updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(1).next(),
      ]);
      return `${name}:${count}:${latest?.updatedAt ?? ""}`;
    }),
    ...SMALL.map(async (name) => `${name}:${JSON.stringify(await db.collection(name).find().toArray())}`),
  ]);
  hash.update(parts.join("|"));
  return hash.digest("hex").slice(0, 16);
}
