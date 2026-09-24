import Link from "next/link";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

/** Plain Link-based pager (works with JS disabled) — appends/replaces ?page= on the given base path+query. */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
  t,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  t: Dictionary;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="text-sm font-medium text-brown hover:text-orange">
          {t.pagination.previous}
        </Link>
      ) : (
        <span className="text-sm font-medium text-brown-soft/40">{t.pagination.previous}</span>
      )}
      <span className="text-sm text-brown-soft">
        {format(t.pagination.pageOf, { page, total: totalPages })}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-sm font-medium text-brown hover:text-orange">
          {t.pagination.next}
        </Link>
      ) : (
        <span className="text-sm font-medium text-brown-soft/40">{t.pagination.next}</span>
      )}
    </nav>
  );
}
