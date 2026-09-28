/** Only same-site paths are allowed as post-login destinations (no open redirects). */
export function safeCallback(value: string | null | undefined, fallback = "/narras"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
