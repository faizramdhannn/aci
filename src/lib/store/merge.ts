import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import { generateProductSlug, getStoreProductsByIds } from "@/lib/store/data";
import { planMerge } from "@/lib/store/merge-plan";
import type { CartItem, Customer, StoreOrder, StoreProduct } from "@/types/store";

/**
 * Merges products into the first id, and points everything that referenced
 * the others (orders, carts, wishlists, reviews, comments) at the merged
 * product and its new variants. Photos are kept (they're reused).
 */
export async function mergeProducts(ids: string[], title?: string): Promise<StoreProduct> {
  const found = await getStoreProductsByIds(ids);
  const products = ids.map((id) => found.find((p) => p._id === id)).filter((p): p is StoreProduct => Boolean(p));
  if (products.length < 2) throw new Error("need at least two products");

  const { product, variantMap, removedIds } = planMerge(products, title);
  const merged: StoreProduct = {
    ...product,
    slug: product.title === products[0].title ? products[0].slug : await generateProductSlug(product.title, product._id),
    updatedAt: new Date().toISOString(),
  };
  const all = new Set(products.map((p) => p._id));
  const remapLine = <T extends { productId: string; variantId: string }>(line: T): T => {
    const variantId = variantMap.get(`${line.productId}:${line.variantId}`);
    return variantId ? { ...line, productId: merged._id, variantId } : line;
  };
  const remapCart = (cart: CartItem[]) => {
    const out: CartItem[] = [];
    for (const line of cart.map(remapLine)) {
      const same = out.find((l) => l.productId === line.productId && l.variantId === line.variantId);
      if (same) same.qty += line.qty;
      else out.push({ ...line });
    }
    return out;
  };
  const remapWishlist = (list: string[]) => [...new Set(list.map((id) => (all.has(id) ? merged._id : id)))];

  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.storeProducts = store.storeProducts.filter((p) => !removedIds.includes(p._id)).map((p) => (p._id === merged._id ? merged : p));
    for (const o of store.storeOrders) o.items = o.items.map(remapLine);
    for (const c of store.customers) {
      c.cart = remapCart(c.cart);
      if (c.wishlist) c.wishlist = remapWishlist(c.wishlist);
    }
    for (const r of store.reviews) if (all.has(r.productId)) r.productId = merged._id;
    for (const c of store.comments) if (c.target === "product" && all.has(c.targetId)) c.targetId = merged._id;
    return merged;
  }

  const { _id, ...rest } = merged;
  await db.collection<StoreProduct>("storeProducts").replaceOne({ _id }, { ...rest } as StoreProduct);
  await db.collection<StoreProduct>("storeProducts").deleteMany({ _id: { $in: removedIds } });

  const orders = await db.collection<StoreOrder>("storeOrders").find({ "items.productId": { $in: removedIds.concat(_id) } }).toArray();
  for (const o of orders) {
    await db.collection<StoreOrder>("storeOrders").updateOne({ _id: o._id }, { $set: { items: o.items.map(remapLine) } });
  }
  const customers = await db
    .collection<Customer>("customers")
    .find({ $or: [{ "cart.productId": { $in: [...all] } }, { wishlist: { $in: [...all] } }] })
    .toArray();
  for (const c of customers) {
    await db
      .collection<Customer>("customers")
      .updateOne({ _id: c._id }, { $set: { cart: remapCart(c.cart ?? []), wishlist: remapWishlist(c.wishlist ?? []) } });
  }
  await db.collection("reviews").updateMany({ productId: { $in: removedIds } }, { $set: { productId: _id } });
  await db.collection("comments").updateMany({ target: "product", targetId: { $in: removedIds } }, { $set: { targetId: _id } });
  return merged;
}
