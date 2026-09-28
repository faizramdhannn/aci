/**
 * Superadmins: by.narras accounts (email + password or Google) with full
 * access to /admin. Extra emails can be added without a code change via the
 * SUPERADMIN_EMAILS env var (comma-separated).
 */
const BUILT_IN = ["faizramdhan17@gmail.com"];

export function superadminEmails(): string[] {
  const extra = (process.env.SUPERADMIN_EMAILS ?? "").split(",");
  return [...BUILT_IN, ...extra].map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && superadminEmails().includes(email!.trim().toLowerCase());
}
