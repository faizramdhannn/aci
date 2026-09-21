import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { Category, ClickEvent, Hotspot, ShoppableImage, ViewEvent } from "@/types";
import { randomUUID } from "crypto";

/**
 * Thin data-access layer: reads/writes Mongo when MONGODB_URI is configured
 * and reachable. Otherwise it reads and writes an in-process memory store
 * (seeded with demo data) so the whole admin flow works on a fresh local
 * checkout with zero external services.
 */

export async function listShoppableImages(): Promise<ShoppableImage[]> {
  const db = await getDb();
  if (!db) return getMemoryStore().images;
  return db.collection<ShoppableImage>("shoppableImages").find().sort({ createdAt: -1 }).toArray();
}

export async function getShoppableImageBySlug(slug: string): Promise<ShoppableImage | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().images.find((image) => image.slug === slug) ?? null;
  return db.collection<ShoppableImage>("shoppableImages").findOne({ slug });
}

export async function getShoppableImageById(id: string): Promise<ShoppableImage | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().images.find((image) => image._id === id) ?? null;
  return db.collection<ShoppableImage>("shoppableImages").findOne({ _id: id });
}

export async function listHotspotsForImage(imageId: string): Promise<Hotspot[]> {
  const db = await getDb();
  if (!db) return getMemoryStore().hotspots.filter((h) => h.shoppableImageId === imageId);
  return db.collection<Hotspot>("hotspots").find({ shoppableImageId: imageId }).toArray();
}

export async function getHotspotById(id: string): Promise<Hotspot | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().hotspots.find((h) => h._id === id) ?? null;
  return db.collection<Hotspot>("hotspots").findOne({ _id: id });
}

export async function upsertHotspot(hotspot: Hotspot): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    const idx = store.hotspots.findIndex((h) => h._id === hotspot._id);
    if (idx >= 0) store.hotspots[idx] = hotspot;
    else store.hotspots.push(hotspot);
    return;
  }
  await db.collection<Hotspot>("hotspots").updateOne({ _id: hotspot._id }, { $set: hotspot }, { upsert: true });
}

export async function deleteHotspot(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.hotspots = store.hotspots.filter((h) => h._id !== id);
    return;
  }
  await db.collection<Hotspot>("hotspots").deleteOne({ _id: id });
}

export async function createShoppableImage(image: ShoppableImage): Promise<void> {
  const db = await getDb();
  if (!db) {
    getMemoryStore().images.unshift(image);
    return;
  }
  await db.collection<ShoppableImage>("shoppableImages").insertOne(image);
}

export async function updateShoppableImage(
  id: string,
  patch: Partial<ShoppableImage>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    const idx = store.images.findIndex((i) => i._id === id);
    if (idx >= 0) store.images[idx] = { ...store.images[idx], ...patch, updatedAt: new Date().toISOString() };
    return;
  }
  await db
    .collection<ShoppableImage>("shoppableImages")
    .updateOne({ _id: id }, { $set: { ...patch, updatedAt: new Date().toISOString() } });
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return getMemoryStore().categories;
  return db.collection<Category>("categories").find().sort({ sortOrder: 1 }).toArray();
}

export async function recordView(event: Omit<ViewEvent, "_id" | "createdAt">): Promise<void> {
  const full: ViewEvent = { ...event, _id: randomUUID(), createdAt: new Date().toISOString() };
  const db = await getDb();
  if (!db) {
    getMemoryStore().views.push(full);
    return;
  }
  await db.collection<ViewEvent>("viewEvents").insertOne(full);
}

export async function recordClick(event: Omit<ClickEvent, "_id" | "createdAt">): Promise<void> {
  const full: ClickEvent = { ...event, _id: randomUUID(), createdAt: new Date().toISOString() };
  const db = await getDb();
  if (!db) {
    getMemoryStore().clicks.push(full);
    return;
  }
  await db.collection<ClickEvent>("clickEvents").insertOne(full);
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  uniqueSessions: number;
  clicksByDevice: { device: string; count: number }[];
  clicksOverTime: { date: string; clicks: number; views: number }[];
  topHotspots: { hotspotId: string; title: string; clicks: number }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = await getDb();

  const views: ViewEvent[] = db
    ? await db.collection<ViewEvent>("viewEvents").find().toArray()
    : getMemoryStore().views;
  const clicks: ClickEvent[] = db
    ? await db.collection<ClickEvent>("clickEvents").find().toArray()
    : getMemoryStore().clicks;
  const hotspots: Hotspot[] = db
    ? await db.collection<Hotspot>("hotspots").find().toArray()
    : getMemoryStore().hotspots;

  const totalViews = views.length;
  const totalClicks = clicks.length;
  const ctr = totalViews > 0 ? totalClicks / totalViews : 0;
  const uniqueSessions = new Set([...views.map((v) => v.sessionId), ...clicks.map((c) => c.sessionId)]).size;

  const deviceCounts = new Map<string, number>();
  for (const click of clicks) {
    deviceCounts.set(click.deviceType, (deviceCounts.get(click.deviceType) ?? 0) + 1);
  }
  const clicksByDevice = Array.from(deviceCounts.entries()).map(([device, count]) => ({ device, count }));

  const byDate = new Map<string, { clicks: number; views: number }>();
  for (const click of clicks) {
    const date = click.createdAt.slice(0, 10);
    const entry = byDate.get(date) ?? { clicks: 0, views: 0 };
    entry.clicks += 1;
    byDate.set(date, entry);
  }
  for (const view of views) {
    const date = view.createdAt.slice(0, 10);
    const entry = byDate.get(date) ?? { clicks: 0, views: 0 };
    entry.views += 1;
    byDate.set(date, entry);
  }
  const clicksOverTime = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const clicksPerHotspot = new Map<string, number>();
  for (const click of clicks) {
    clicksPerHotspot.set(click.hotspotId, (clicksPerHotspot.get(click.hotspotId) ?? 0) + 1);
  }
  const topHotspots = Array.from(clicksPerHotspot.entries())
    .map(([hotspotId, count]) => ({
      hotspotId,
      title: hotspots.find((h) => h._id === hotspotId)?.title ?? "Unknown product",
      clicks: count,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return { totalViews, totalClicks, ctr, uniqueSessions, clicksByDevice, clicksOverTime, topHotspots };
}
