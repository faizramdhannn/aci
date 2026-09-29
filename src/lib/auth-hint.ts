/** Readable (not httpOnly) cookie set by src/proxy.ts: "customer" | "admin" while signed in. Holds no secrets. */
export const AUTH_HINT_COOKIE = "narras_auth";

export function readAuthHint(): "customer" | "admin" | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie.match(/(?:^|; )narras_auth=([^;]*)/)?.[1];
  return value === "admin" || value === "customer" ? value : null;
}
