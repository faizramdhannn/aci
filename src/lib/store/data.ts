import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import { deleteStoredImage } from "@/lib/storage";
import { toWhatsappDigits } from "@/lib/store/whatsapp";
import type {
  OrderCustomer,
  OrderItem,
  OrderStatus,
  StoreOrder,
  StoreProduct,
  StoreSettings,
} from "@/types/store";

/**
 * Data access for by.narras. Same pattern as the outfit site: MongoDB when
 * configured, the in-process memory store in local development otherwise.
 */

const PRODUCTS = "storeProducts";
const ORDERS = "storeOrders";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "by.narras",
  whatsappNumber: "",
  tagline: "Kerudung yang nyaman dipakai seharian.",
  paymentInfo: "",
  instagramUrl: "",
};

// ── Products ────────────────────────────────────────────────────────────────

export async function listStoreProducts(opts: { activeOnly?: boolean } = {}): Promise<StoreProduct[]> {
  const db = await getDb();
  if (!db) {
    return [...getMemoryStore().storeProducts]
      .filter((p) => !opts.activeOnly || p.status === "active")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return db
    .collection<StoreProduct>(PRODUCTS)
    .find(opts.activeOnly ? { status: "active" } : {})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getStoreProductById(id: string): Promise<StoreProduct | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().storeProducts.find((p) => p._id === id) ?? null;
  return db.collection<StoreProduct>(PRODUCTS).findOne({ _id: id });
}

export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().storeProducts.find((p) => p.slug === slug) ?? null;
  return db.collection<StoreProduct>(PRODUCTS).findOne({ slug });
}

export async function getStoreProductsByIds(ids: string[]): Promise<StoreProduct[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return getMemoryStore().storeProducts.filter((p) => ids.includes(p._id));
  return db.collection<StoreProduct>(PRODUCTS).find({ _id: { $in: ids } }).toArray();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generateProductSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || randomUUID().slice(0, 8);
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const existing = await getStoreProductBySlug(candidate);
    if (!existing || existing._id === excludeId) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function createStoreProduct(product: StoreProduct): Promise<void> {
  const db = await getDb();
  if (!db) {
    getMemoryStore().storeProducts.push(product);
    return;
  }
  await db.collection<StoreProduct>(PRODUCTS).insertOne(product);
}

export async function updateStoreProduct(id: string, patch: Partial<StoreProduct>): Promise<void> {
  const next = { ...patch, updatedAt: new Date().toISOString() };
  const db = await getDb();
  if (!db) {
    const product = getMemoryStore().storeProducts.find((p) => p._id === id);
    if (product) Object.assign(product, next);
    return;
  }
  await db.collection<StoreProduct>(PRODUCTS).updateOne({ _id: id }, { $set: next });
}

/** Deletes the images from storage too — they're uploaded per product. */
export async function deleteStoreProduct(id: string): Promise<void> {
  const product = await getStoreProductById(id);
  if (!product) return;
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.storeProducts = store.storeProducts.filter((p) => p._id !== id);
  } else {
    await db.collection<StoreProduct>(PRODUCTS).deleteOne({ _id: id });
  }
  await Promise.all(product.images.map((url) => deleteStoredImage(url).catch(() => undefined)));
}

export function totalStock(product: StoreProduct): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

// ── Stock ───────────────────────────────────────────────────────────────────

interface StockLine {
  productId: string;
  variantId: string;
  qty: number;
}

/** Atomically takes `qty` from one variant if enough is left. */
async function takeStock(line: StockLine): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    const variant = getMemoryStore()
      .storeProducts.find((p) => p._id === line.productId)
      ?.variants.find((v) => v.id === line.variantId);
    if (!variant || variant.stock < line.qty) return false;
    variant.stock -= line.qty;
    return true;
  }
  const res = await db.collection<StoreProduct>(PRODUCTS).updateOne(
    { _id: line.productId, variants: { $elemMatch: { id: line.variantId, stock: { $gte: line.qty } } } },
    { $inc: { "variants.$.stock": -line.qty } }
  );
  return res.modifiedCount === 1;
}

async function returnStock(line: StockLine): Promise<void> {
  const db = await getDb();
  if (!db) {
    const variant = getMemoryStore()
      .storeProducts.find((p) => p._id === line.productId)
      ?.variants.find((v) => v.id === line.variantId);
    if (variant) variant.stock += line.qty;
    return;
  }
  await db
    .collection<StoreProduct>(PRODUCTS)
    .updateOne({ _id: line.productId, "variants.id": line.variantId }, { $inc: { "variants.$.stock": line.qty } });
}

/** Takes stock for every line, or none of them: on the first shortfall, what was taken is put back. */
async function reserveAll(lines: StockLine[]): Promise<StockLine | null> {
  const taken: StockLine[] = [];
  for (const line of lines) {
    if (await takeStock(line)) {
      taken.push(line);
      continue;
    }
    await Promise.all(taken.map(returnStock));
    return line;
  }
  return null;
}

// ── Orders ──────────────────────────────────────────────────────────────────

export class OrderError extends Error {
  constructor(
    public code: "empty" | "unavailable" | "out_of_stock",
    public detail?: { productId: string; variantId: string }
  ) {
    super(code);
  }
}

async function nextOrderNumber(): Promise<string> {
  const db = await getDb();
  let n: number;
  if (!db) {
    n = ++getMemoryStore().orderCounter;
  } else {
    const doc = await db
      .collection<{ _id: string; seq: number }>("counters")
      .findOneAndUpdate({ _id: "storeOrder" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    n = doc?.seq ?? Date.now();
  }
  return `NR-${String(n).padStart(4, "0")}`;
}

/**
 * Prices and names come from the database, never from the client. Stock is
 * reserved when the order is placed so two buyers can't take the last piece;
 * cancelling an order gives it back.
 */
export async function placeOrder(input: {
  lines: StockLine[];
  customer: OrderCustomer;
}): Promise<StoreOrder> {
  // Merge duplicate lines for the same variant.
  const merged = new Map<string, StockLine>();
  for (const line of input.lines) {
    const key = `${line.productId}:${line.variantId}`;
    const prev = merged.get(key);
    merged.set(key, { ...line, qty: (prev?.qty ?? 0) + line.qty });
  }
  const lines = [...merged.values()];
  if (lines.length === 0) throw new OrderError("empty");

  const products = await getStoreProductsByIds([...new Set(lines.map((l) => l.productId))]);
  const items: OrderItem[] = [];
  for (const line of lines) {
    const product = products.find((p) => p._id === line.productId && p.status === "active");
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) throw new OrderError("unavailable", line);
    items.push({
      productId: product._id,
      variantId: variant.id,
      title: product.title,
      variantName: variant.name,
      price: product.price,
      qty: line.qty,
      image: product.images[0],
    });
  }

  const short = await reserveAll(lines);
  if (short) throw new OrderError("out_of_stock", short);

  const now = new Date().toISOString();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order: StoreOrder = {
    _id: randomUUID(),
    number: await nextOrderNumber(),
    items,
    subtotal,
    total: subtotal,
    customer: input.customer,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  if (!db) getMemoryStore().storeOrders.push(order);
  else await db.collection<StoreOrder>(ORDERS).insertOne(order);
  return order;
}

export async function listOrders(opts: { status?: OrderStatus } = {}): Promise<StoreOrder[]> {
  const db = await getDb();
  if (!db) {
    return getMemoryStore()
      .storeOrders.filter((o) => !opts.status || o.status === opts.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return db
    .collection<StoreOrder>(ORDERS)
    .find(opts.status ? { status: opts.status } : {})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getOrderById(id: string): Promise<StoreOrder | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().storeOrders.find((o) => o._id === id) ?? null;
  return db.collection<StoreOrder>(ORDERS).findOne({ _id: id });
}

export type OrderPatch = Partial<Pick<StoreOrder, "status" | "shippingCost" | "trackingNumber" | "courier" | "adminNote">>;

/**
 * Applies an admin edit. Moving an order into "cancelled" returns its stock;
 * moving it back out takes the stock again (and fails if it's gone).
 */
export async function updateOrder(id: string, patch: OrderPatch): Promise<StoreOrder> {
  const order = await getOrderById(id);
  if (!order) throw new OrderError("unavailable");

  const lines = order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }));
  if (patch.status && patch.status !== order.status) {
    if (patch.status === "cancelled") {
      await Promise.all(lines.map(returnStock));
    } else if (order.status === "cancelled") {
      const short = await reserveAll(lines);
      if (short) throw new OrderError("out_of_stock", short);
    }
  }

  const shippingCost = patch.shippingCost !== undefined ? patch.shippingCost : order.shippingCost;
  const next: StoreOrder = {
    ...order,
    ...patch,
    shippingCost,
    total: order.subtotal + (shippingCost ?? 0),
    updatedAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.storeOrders = store.storeOrders.map((o) => (o._id === id ? next : o));
  } else {
    const { _id, ...rest } = next;
    void _id;
    await db.collection<StoreOrder>(ORDERS).updateOne({ _id: id }, { $set: rest });
  }
  return next;
}

// ── Customers & stats (derived from orders) ─────────────────────────────────

export interface StoreCustomer {
  phone: string;
  name: string;
  city: string;
  orders: number;
  spent: number;
  lastOrderAt: string;
}

export function customersFromOrders(orders: StoreOrder[]): StoreCustomer[] {
  const byPhone = new Map<string, StoreCustomer>();
  // Oldest first, so the latest order's name/city wins.
  for (const order of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const key = toWhatsappDigits(order.customer.phone);
    const prev = byPhone.get(key);
    const counts = order.status !== "cancelled";
    byPhone.set(key, {
      phone: order.customer.phone,
      name: order.customer.name,
      city: order.customer.city,
      orders: (prev?.orders ?? 0) + (counts ? 1 : 0),
      spent: (prev?.spent ?? 0) + (counts ? order.total : 0),
      lastOrderAt: order.createdAt,
    });
  }
  return [...byPhone.values()].sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}

/** Orders that count as sales: money received or on its way. */
export const SALE_STATUSES: OrderStatus[] = ["paid", "shipped", "completed"];

// ── Settings ────────────────────────────────────────────────────────────────

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = await getDb();
  if (!db) return { ...DEFAULT_STORE_SETTINGS, ...(getMemoryStore().storeSettings ?? {}) };
  const doc = await db.collection<StoreSettings & { _id: string }>("settings").findOne({ _id: "store" });
  if (!doc) return DEFAULT_STORE_SETTINGS;
  const { _id, ...settings } = doc;
  void _id;
  return { ...DEFAULT_STORE_SETTINGS, ...settings };
}

export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.storeSettings = { ...DEFAULT_STORE_SETTINGS, ...(store.storeSettings ?? {}), ...patch };
    return;
  }
  await db
    .collection<StoreSettings & { _id: string }>("settings")
    .updateOne({ _id: "store" }, { $set: patch }, { upsert: true });
}

const jakartaDay = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

/** Dashboard numbers. "Today" is the calendar day in Jakarta. */
export function salesSummary(orders: StoreOrder[], now = new Date()) {
  const today = jakartaDay(now);
  const since30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const sales = orders.filter((o) => SALE_STATUSES.includes(o.status));
  return {
    today: sales.filter((o) => jakartaDay(new Date(o.createdAt)) === today).reduce((s, o) => s + o.total, 0),
    last30: sales.filter((o) => new Date(o.createdAt).getTime() >= since30).reduce((s, o) => s + o.total, 0),
    toConfirm: orders.filter((o) => o.status === "pending").length,
    toShip: orders.filter((o) => o.status === "paid").length,
  };
}
