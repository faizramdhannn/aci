import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { Annotation, Category, ClickEvent, Hotspot, ShoppableImage, SiteSettings, ViewEvent } from "@/types";
import { randomUUID } from "crypto";
import type { Filter } from "mongodb";
import { paginate, type Paginated } from "@/lib/pagination";

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

export async function listHotspotsForImages(imageIds: string[]): Promise<Hotspot[]> {
  if (imageIds.length === 0) return [];
  const db = await getDb();
  if (!db) return getMemoryStore().hotspots.filter((h) => imageIds.includes(h.shoppableImageId));
  return db.collection<Hotspot>("hotspots").find({ shoppableImageId: { $in: imageIds } }).toArray();
}

export async function listAnnotationsForImages(imageIds: string[]): Promise<Annotation[]> {
  if (imageIds.length === 0) return [];
  const db = await getDb();
  if (!db) return getMemoryStore().annotations.filter((a) => imageIds.includes(a.shoppableImageId));
  return db.collection<Annotation>("annotations").find({ shoppableImageId: { $in: imageIds } }).toArray();
}

/**
 * One page of published looks, newest first, paginated in the database
 * (skip/limit) rather than by loading the whole catalog into Node. With a
 * categoryId, a look matches if it carries the category itself or any of its
 * products (hotspots) do.
 */
export async function listPublishedImagesPage({
  page,
  pageSize,
  categoryId,
}: {
  page: number;
  pageSize: number;
  categoryId?: string;
}): Promise<Paginated<ShoppableImage>> {
  const db = await getDb();

  if (!db) {
    const store = getMemoryStore();
    const matching = store.images
      .filter((i) => i.status === "published")
      .filter((i) => {
        if (!categoryId) return true;
        if (i.categoryIds.includes(categoryId)) return true;
        return store.hotspots.some(
          (h) => h.shoppableImageId === i._id && (h.categoryIds ?? []).includes(categoryId)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(matching, page, pageSize);
  }

  const filter: Filter<ShoppableImage> = { status: "published" };
  if (categoryId) {
    const viaProducts = await db
      .collection<Hotspot>("hotspots")
      .distinct("shoppableImageId", { categoryIds: categoryId });
    filter.$or = [{ categoryIds: categoryId }, { _id: { $in: viaProducts } }];
  }

  const images = db.collection<ShoppableImage>("shoppableImages");
  const total = await images.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = await images
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return { items, page: safePage, totalPages, total };
}

/**
 * Looks for the homepage hero carousel: ones explicitly marked featured, or —
 * until any are — just the newest one, so the hero is never empty and the
 * grid below still has something to show on a small catalog.
 */
export async function listFeaturedImages(limit = 5): Promise<ShoppableImage[]> {
  const db = await getDb();
  if (!db) {
    const published = getMemoryStore()
      .images.filter((i) => i.status === "published")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const featured = published.filter((i) => i.featured);
    return featured.length > 0 ? featured.slice(0, limit) : published.slice(0, 1);
  }
  const images = db.collection<ShoppableImage>("shoppableImages");
  const featured = await images.find({ status: "published", featured: true }).sort({ createdAt: -1 }).limit(limit).toArray();
  if (featured.length > 0) return featured;
  return images.find({ status: "published" }).sort({ createdAt: -1 }).limit(1).toArray();
}

export async function listPublishedImagesExcluding(excludeIds: string[], limit: number): Promise<ShoppableImage[]> {
  const db = await getDb();
  if (!db) {
    return getMemoryStore()
      .images.filter((i) => i.status === "published" && !excludeIds.includes(i._id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  return db
    .collection<ShoppableImage>("shoppableImages")
    .find({ status: "published", _id: { $nin: excludeIds } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function listPublishedImages(): Promise<ShoppableImage[]> {
  const db = await getDb();
  if (!db) return getMemoryStore().images.filter((i) => i.status === "published");
  return db
    .collection<ShoppableImage>("shoppableImages")
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .toArray();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** A slug for `title` not already used by another look: "golden-hour", then "golden-hour-2", "-3", … */
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || randomUUID().slice(0, 8);
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const existing = await getShoppableImageBySlug(candidate);
    if (!existing || existing._id === excludeId) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
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

/** Deletes a look and cascades to its own hotspots/annotations. View/click history is left as-is (historical record). */
export async function deleteShoppableImage(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.images = store.images.filter((i) => i._id !== id);
    store.hotspots = store.hotspots.filter((h) => h.shoppableImageId !== id);
    store.annotations = store.annotations.filter((a) => a.shoppableImageId !== id);
    return;
  }
  await Promise.all([
    db.collection<ShoppableImage>("shoppableImages").deleteOne({ _id: id }),
    db.collection<Hotspot>("hotspots").deleteMany({ shoppableImageId: id }),
    db.collection<Annotation>("annotations").deleteMany({ shoppableImageId: id }),
  ]);
}

/**
 * Duplicates a look (as a new draft, so nothing goes live by accident) along
 * with all of its hotspots and annotations, remapped to the new image id.
 */
export async function duplicateShoppableImage(id: string): Promise<ShoppableImage | null> {
  const original = await getShoppableImageById(id);
  if (!original) return null;

  const [hotspots, annotations] = await Promise.all([listHotspotsForImage(id), listAnnotationsForImage(id)]);

  const now = new Date().toISOString();
  const newImageId = randomUUID();
  const copy: ShoppableImage = {
    ...original,
    _id: newImageId,
    title: `${original.title} (copy)`,
    slug: await generateUniqueSlug(`${original.title} copy`),
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
  };
  await createShoppableImage(copy);

  await Promise.all([
    ...hotspots.map((h) => upsertHotspot({ ...h, _id: randomUUID(), shoppableImageId: newImageId, createdAt: now, updatedAt: now })),
    ...annotations.map((a) =>
      upsertAnnotation({ ...a, _id: randomUUID(), shoppableImageId: newImageId, createdAt: now, updatedAt: now })
    ),
  ]);

  return copy;
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

  const published = await listPublishedImages();
  const allHotspots = await listHotspotsForImages(published.map((i) => i._id));

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

interface EventCounts {
  totalViews: number;
  totalClicks: number;
  uniqueSessions: number;
  viewsByDate: Map<string, number>;
  clicksByDate: Map<string, number>;
  clicksByDevice: Map<string, number>;
  clicksByHotspot: Map<string, number>;
}

/**
 * Raw event tallies. With Mongo this runs as aggregation pipelines ($group on
 * the server) so the page never loads every view/click event into Node — the
 * memory-store fallback is dev-only and small, so it just loops.
 */
async function countEvents(): Promise<EventCounts> {
  const db = await getDb();

  if (!db) {
    const { views, clicks } = getMemoryStore();
    const tally = <T,>(items: T[], key: (item: T) => string) => {
      const map = new Map<string, number>();
      for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
      return map;
    };
    return {
      totalViews: views.length,
      totalClicks: clicks.length,
      uniqueSessions: new Set([...views.map((v) => v.sessionId), ...clicks.map((c) => c.sessionId)]).size,
      viewsByDate: tally(views, (v) => v.createdAt.slice(0, 10)),
      clicksByDate: tally(clicks, (c) => c.createdAt.slice(0, 10)),
      clicksByDevice: tally(clicks, (c) => c.deviceType),
      clicksByHotspot: tally(clicks, (c) => c.hotspotId),
    };
  }

  const viewsCol = db.collection<ViewEvent>("viewEvents");
  const clicksCol = db.collection<ClickEvent>("clickEvents");
  type Bucket = { _id: string; n: number };
  const groupBy = (field: string) => [{ $group: { _id: field, n: { $sum: 1 } } }];
  const byDate = [{ $group: { _id: { $substrBytes: ["$createdAt", 0, 10] }, n: { $sum: 1 } } }];
  const toMap = (rows: Bucket[]) => new Map(rows.map((r) => [String(r._id), r.n]));

  const [totalViews, totalClicks, sessions, viewsByDate, clicksByDate, clicksByDevice, clicksByHotspot] =
    await Promise.all([
      viewsCol.estimatedDocumentCount(),
      clicksCol.estimatedDocumentCount(),
      viewsCol
        .aggregate<{ n: number }>([
          { $project: { sessionId: 1 } },
          { $unionWith: { coll: "clickEvents", pipeline: [{ $project: { sessionId: 1 } }] } },
          { $group: { _id: "$sessionId" } },
          { $count: "n" },
        ])
        .toArray(),
      viewsCol.aggregate<Bucket>(byDate).toArray(),
      clicksCol.aggregate<Bucket>(byDate).toArray(),
      clicksCol.aggregate<Bucket>(groupBy("$deviceType")).toArray(),
      clicksCol.aggregate<Bucket>(groupBy("$hotspotId")).toArray(),
    ]);

  return {
    totalViews,
    totalClicks,
    uniqueSessions: sessions[0]?.n ?? 0,
    viewsByDate: toMap(viewsByDate),
    clicksByDate: toMap(clicksByDate),
    clicksByDevice: toMap(clicksByDevice),
    clicksByHotspot: toMap(clicksByHotspot),
  };
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [counts, hotspots, categories] = await Promise.all([countEvents(), listAllHotspots(), listCategories()]);
  const hotspotById = new Map(hotspots.map((h) => [h._id, h]));
  const categoryById = new Map(categories.map((c) => [c._id, c]));

  const dates = new Set([...counts.viewsByDate.keys(), ...counts.clicksByDate.keys()]);
  const clicksOverTime = [...dates]
    .sort()
    .map((date) => ({ date, clicks: counts.clicksByDate.get(date) ?? 0, views: counts.viewsByDate.get(date) ?? 0 }));

  const clicksByDevice = [...counts.clicksByDevice].map(([device, count]) => ({ device, count }));

  const topHotspots = [...counts.clicksByHotspot]
    .map(([hotspotId, clicks]) => ({
      hotspotId,
      title: hotspotById.get(hotspotId)?.title ?? "Unknown product",
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // A click counts toward every category its product carries (a product can
  // belong to more than one), so totals across categories can exceed totalClicks.
  const clicksPerCategory = new Map<string, number>();
  for (const [hotspotId, clicks] of counts.clicksByHotspot) {
    for (const categoryId of hotspotById.get(hotspotId)?.categoryIds ?? []) {
      clicksPerCategory.set(categoryId, (clicksPerCategory.get(categoryId) ?? 0) + clicks);
    }
  }
  const topCategories = [...clicksPerCategory]
    .map(([categoryId, clicks]) => ({
      categoryId,
      name: categoryById.get(categoryId)?.name ?? "Unknown category",
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return {
    totalViews: counts.totalViews,
    totalClicks: counts.totalClicks,
    ctr: counts.totalViews > 0 ? counts.totalClicks / counts.totalViews : 0,
    uniqueSessions: counts.uniqueSessions,
    clicksByDevice,
    clicksOverTime,
    topHotspots,
    topCategories,
  };
}

export interface ProductPerformanceRow {
  hotspotId: string;
  productTitle: string;
  lookTitle: string;
  categories: string;
  clicks: number;
}

/** Full (not top-N) per-product click totals, for CSV export/reporting — e.g. to a brand/affiliate partner. */
export async function getProductPerformance(): Promise<ProductPerformanceRow[]> {
  const [counts, hotspots, images, categories] = await Promise.all([
    countEvents(),
    listAllHotspots(),
    listShoppableImages(),
    listCategories(),
  ]);
  const imageById = new Map(images.map((i) => [i._id, i]));
  const categoryById = new Map(categories.map((c) => [c._id, c]));

  return hotspots
    .map((hotspot) => ({
      hotspotId: hotspot._id,
      productTitle: hotspot.title,
      lookTitle: imageById.get(hotspot.shoppableImageId)?.title ?? "Unknown look",
      categories: (hotspot.categoryIds ?? [])
        .map((id) => categoryById.get(id)?.name)
        .filter((name): name is string => Boolean(name))
        .join("; "),
      clicks: counts.clicksByHotspot.get(hotspot._id) ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Aci",
  creatorName: "",
  tagline: "",
  about: "",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = await getDb();
  if (!db) return { ...DEFAULT_SITE_SETTINGS, ...(getMemoryStore().settings ?? {}) };
  const doc = await db.collection<SiteSettings & { _id: string }>("settings").findOne({ _id: "site" });
  if (!doc) return DEFAULT_SITE_SETTINGS;
  const { _id, ...settings } = doc;
  void _id;
  return { ...DEFAULT_SITE_SETTINGS, ...settings };
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.settings = { ...DEFAULT_SITE_SETTINGS, ...(store.settings ?? {}), ...patch };
    return;
  }
  await db
    .collection<SiteSettings & { _id: string }>("settings")
    .updateOne({ _id: "site" }, { $set: patch }, { upsert: true });
}
