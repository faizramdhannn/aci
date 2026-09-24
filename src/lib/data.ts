import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { Annotation, Category, ClickEvent, Hotspot, ShoppableImage, ViewEvent } from "@/types";
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

export async function listAllHotspots(): Promise<Hotspot[]> {
  const db = await getDb();
  if (!db) return getMemoryStore().hotspots;
  return db.collection<Hotspot>("hotspots").find().toArray();
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

export async function listAnnotationsForImage(imageId: string): Promise<Annotation[]> {
  const db = await getDb();
  if (!db) return getMemoryStore().annotations.filter((a) => a.shoppableImageId === imageId);
  return db.collection<Annotation>("annotations").find({ shoppableImageId: imageId }).toArray();
}

export async function upsertAnnotation(annotation: Annotation): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    const idx = store.annotations.findIndex((a) => a._id === annotation._id);
    if (idx >= 0) store.annotations[idx] = annotation;
    else store.annotations.push(annotation);
    return;
  }
  await db
    .collection<Annotation>("annotations")
    .updateOne({ _id: annotation._id }, { $set: annotation }, { upsert: true });
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.annotations = store.annotations.filter((a) => a._id !== id);
    return;
  }
  await db.collection<Annotation>("annotations").deleteOne({ _id: id });
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

export async function createCategory(category: Category): Promise<void> {
  const db = await getDb();
  if (!db) {
    getMemoryStore().categories.push(category);
    return;
  }
  await db.collection<Category>("categories").insertOne(category);
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    const idx = store.categories.findIndex((c) => c._id === id);
    if (idx >= 0) store.categories[idx] = { ...store.categories[idx], ...patch };
    return;
  }
  await db.collection<Category>("categories").updateOne({ _id: id }, { $set: patch });
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.categories = store.categories.filter((c) => c._id !== id);
    return;
  }
  await db.collection<Category>("categories").deleteOne({ _id: id });
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

export interface HotspotHeat {
  hotspotId: string;
  title: string;
  x: number;
  y: number;
  clicks: number;
}

/** Per-hotspot click counts for one shoppable image, for the click heatmap. */
export async function getHeatmapForImage(imageId: string): Promise<HotspotHeat[]> {
  const db = await getDb();
  const hotspots = await listHotspotsForImage(imageId);
  const clicks: ClickEvent[] = db
    ? await db.collection<ClickEvent>("clickEvents").find({ shoppableImageId: imageId }).toArray()
    : getMemoryStore().clicks.filter((c) => c.shoppableImageId === imageId);

  const countByHotspot = new Map<string, number>();
  for (const click of clicks) {
    countByHotspot.set(click.hotspotId, (countByHotspot.get(click.hotspotId) ?? 0) + 1);
  }

  return hotspots.map((hotspot) => ({
    hotspotId: hotspot._id,
    title: hotspot.title,
    x: hotspot.x,
    y: hotspot.y,
    clicks: countByHotspot.get(hotspot._id) ?? 0,
  }));
}

/**
 * Raw normalized click positions for one image, for a true per-pixel
 * heatmap. Only clicks recorded after click-position tracking shipped have
 * clickX/clickY — older ones are silently excluded rather than guessed at.
 */
export async function listClickPointsForImage(imageId: string): Promise<{ x: number; y: number }[]> {
  const db = await getDb();
  const clicks: ClickEvent[] = db
    ? await db.collection<ClickEvent>("clickEvents").find({ shoppableImageId: imageId }).toArray()
    : getMemoryStore().clicks.filter((c) => c.shoppableImageId === imageId);

  return clicks
    .filter((c) => typeof c.clickX === "number" && typeof c.clickY === "number")
    .map((c) => ({ x: c.clickX!, y: c.clickY! }));
}

export interface SearchResults {
  images: ShoppableImage[];
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Scores a candidate string against a lowercased query: exact/prefix/substring
 * matches rank highest, falling back to a per-word typo tolerance (edit
 * distance 1-2 depending on word length) so a small misspelling still finds
 * something. 0 means no match at all.
 */
function matchScore(text: string | undefined, q: string): number {
  if (!text) return 0;
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 65;

  let best = 0;
  for (const word of t.split(/\s+/)) {
    if (word.length < 3) continue;
    const tolerance = q.length <= 4 ? 1 : 2;
    const dist = levenshtein(word, q);
    if (dist <= tolerance) best = Math.max(best, 50 - dist * 10);
  }
  return best;
}

/**
 * Ranked, lightly typo-tolerant search across shoppable image titles/
 * descriptions and their product hotspot titles. Not a real search engine
 * (no stemming, no synonyms) but good enough at catalog scale: exact and
 * prefix matches rank first, substring next, then near-misses.
 */
export async function searchContent(query: string): Promise<SearchResults> {
  const q = query.trim().toLowerCase();
  if (!q) return { images: [] };

  const [allImages, allHotspots] = await Promise.all([listShoppableImages(), listAllHotspots()]);
  const published = allImages.filter((i) => i.status === "published");

  const scoreByImageId = new Map<string, number>();
  for (const image of published) {
    const score = Math.max(matchScore(image.title, q), matchScore(image.description, q) * 0.8);
    if (score > 0) scoreByImageId.set(image._id, score);
  }
  for (const hotspot of allHotspots) {
    const score = matchScore(hotspot.title, q) * 0.9;
    if (score > 0) {
      const current = scoreByImageId.get(hotspot.shoppableImageId) ?? 0;
      scoreByImageId.set(hotspot.shoppableImageId, Math.max(current, score));
    }
  }

  const images = published
    .filter((i) => scoreByImageId.has(i._id))
    .sort((a, b) => scoreByImageId.get(b._id)! - scoreByImageId.get(a._id)!);

  return { images };
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  uniqueSessions: number;
  clicksByDevice: { device: string; count: number }[];
  clicksOverTime: { date: string; clicks: number; views: number }[];
  topHotspots: { hotspotId: string; title: string; clicks: number }[];
  topCategories: { categoryId: string; name: string; clicks: number }[];
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

  // A click counts toward every category its product carries (a product can
  // belong to more than one), so totals across categories can exceed totalClicks.
  const categories = await listCategories();
  const clicksPerCategory = new Map<string, number>();
  for (const click of clicks) {
    const hotspot = hotspots.find((h) => h._id === click.hotspotId);
    for (const categoryId of hotspot?.categoryIds ?? []) {
      clicksPerCategory.set(categoryId, (clicksPerCategory.get(categoryId) ?? 0) + 1);
    }
  }
  const topCategories = Array.from(clicksPerCategory.entries())
    .map(([categoryId, count]) => ({
      categoryId,
      name: categories.find((c) => c._id === categoryId)?.name ?? "Unknown category",
      clicks: count,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return { totalViews, totalClicks, ctr, uniqueSessions, clicksByDevice, clicksOverTime, topHotspots, topCategories };
}
