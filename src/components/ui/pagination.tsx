import Link from "next/link";

/** Plain Link-based pager (works with JS disabled) — appends/replaces ?page= on the given base path+query. */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
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
          ← Previous
        </Link>
      ) : (
        <span className="text-sm font-medium text-brown-soft/40">← Previous</span>
      )}
      <span className="text-sm text-brown-soft">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-sm font-medium text-brown hover:text-orange">
          Next →
        </Link>
      ) : (
        <span className="text-sm font-medium text-brown-soft/40">Next →</span>
      )}
    </nav>
  );
}
