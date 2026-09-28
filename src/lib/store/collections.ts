import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { StoreCollection, StoreProduct } from "@/types/store";

/** Product collections for by.narras (Pashmina, Segi Empat, Koleksi Ramadan, …). */

const COLLECTION = "storeCollections";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8);

export async function listCollections(): Promise<StoreCollection[]> {
  const db = await getDb();
  const all = db
    ? await db.collection<StoreCollection>(COLLECTION).find().toArray()
    : [...getMemoryStore().storeCollections];
  return all.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCollection(name: string): Promise<StoreCollection> {
  const existing = await listCollections();
  let slug = slugify(name);
  for (let n = 2; existing.some((c) => c.slug === slug); n++) slug = `${slugify(name)}-${n}`;
  const collection: StoreCollection = {
    _id: randomUUID(),
    name: name.trim(),
    slug,
    sortOrder: existing.length ? Math.max(...existing.map((c) => c.sortOrder)) + 1 : 0,
  };
  const db = await getDb();
  if (!db) getMemoryStore().storeCollections.push(collection);
  else await db.collection<StoreCollection>(COLLECTION).insertOne(collection);
  return collection;
}

export async function updateCollection(id: string, patch: Partial<Pick<StoreCollection, "name" | "sortOrder">>) {
  const db = await getDb();
  if (!db) {
    const c = getMemoryStore().storeCollections.find((x) => x._id === id);
    if (c) Object.assign(c, patch);
    return;
  }
  await db.collection<StoreCollection>(COLLECTION).updateOne({ _id: id }, { $set: patch });
}

/** Also takes the collection off every product that was in it. */
export async function deleteCollection(id: string) {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.storeCollections = store.storeCollections.filter((c) => c._id !== id);
    for (const p of store.storeProducts) p.collectionIds = (p.collectionIds ?? []).filter((c) => c !== id);
    return;
  }
  await db.collection<StoreCollection>(COLLECTION).deleteOne({ _id: id });
  await db.collection<StoreProduct>("storeProducts").updateMany({ collectionIds: id }, { $pull: { collectionIds: id } });
}
