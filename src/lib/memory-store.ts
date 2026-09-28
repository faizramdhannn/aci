import {
  seedCategories,
  seedClickEvents,
  seedHotspots,
  seedShoppableImages,
  seedViewEvents,
} from "@/lib/seed-data";
import type { HubSettings, ProductComment, StoreOrder, StoreProduct, StoreSettings } from "@/types/store";
import { seedStoreProducts } from "@/lib/store/seed";
import type { Annotation, Category, ClickEvent, Hotspot, ShoppableImage, SiteSettings, ViewEvent } from "@/types";

/**
 * Mutable in-process store used only when MONGODB_URI is not configured.
 * Lets the admin flow (create/edit/delete) work end-to-end on a fresh local
 * checkout, without persisting anything permanently. Resets on server restart.
 */
declare global {
   
  var _aciMemoryStore:
    | {
        images: ShoppableImage[];
        hotspots: Hotspot[];
        categories: Category[];
        views: ViewEvent[];
        clicks: ClickEvent[];
        annotations: Annotation[];
        settings: SiteSettings | null;
        storeProducts: StoreProduct[];
        storeOrders: StoreOrder[];
        storeSettings: StoreSettings | null;
        hubSettings: HubSettings | null;
        comments: ProductComment[];
        orderCounter: number;
      }
    | undefined;
}

function initStore() {
  return {
    images: [...seedShoppableImages],
    hotspots: [...seedHotspots],
    categories: [...seedCategories],
    views: [...seedViewEvents],
    clicks: [...seedClickEvents],
    annotations: [] as Annotation[],
    settings: null as SiteSettings | null,
    storeProducts: structuredClone(seedStoreProducts),
    storeOrders: [] as StoreOrder[],
    storeSettings: null as StoreSettings | null,
    hubSettings: null as HubSettings | null,
    comments: [] as ProductComment[],
    orderCounter: 0,
  };
}

export function getMemoryStore() {
  if (!global._aciMemoryStore) {
    global._aciMemoryStore = initStore();
  }
  // Fill in collections added after a dev server's store was created (HMR keeps globals).
  if (global._aciMemoryStore.comments === undefined) {
    const fresh = initStore();
    for (const key of Object.keys(fresh) as (keyof typeof fresh)[]) {
      if (global._aciMemoryStore[key] === undefined) Object.assign(global._aciMemoryStore, { [key]: fresh[key] });
    }
  }
  return global._aciMemoryStore;
}
