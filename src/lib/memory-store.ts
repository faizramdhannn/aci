import {
  seedCategories,
  seedClickEvents,
  seedHotspots,
  seedShoppableImages,
  seedViewEvents,
} from "@/lib/seed-data";
import type { Category, ClickEvent, Hotspot, ShoppableImage, ViewEvent } from "@/types";

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
  };
}

export function getMemoryStore() {
  if (!global._aciMemoryStore) {
    global._aciMemoryStore = initStore();
  }
  return global._aciMemoryStore;
}
