/**
 * There's no visitor account system (only a single admin login), so
 * favorites live in the browser's localStorage rather than a database —
 * per-device, not synced, but zero-setup and works for the demo/MVP scale.
 */
const FAVORITES_KEY = "aci_favorites";

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id: string): string[] {
  const current = getFavoriteIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode, storage full, etc.) - favorite just won't persist */
  }
  return next;
}
