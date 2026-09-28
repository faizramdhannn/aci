import Link from "next/link";
import { customerId } from "@/lib/auth";
import { canReview, listReviews, ratingsByProduct } from "@/lib/store/reviews";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";
import { Stars } from "@/components/store/stars";
import { ReviewForm } from "@/components/store/review-form";

export async function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, dict, locale, me] = await Promise.all([
    listReviews({ productId }),
    getStoreDictionary(),
    getLocale(),
    customerId(),
  ]);
  const t = dict.reviews;
  const visible = reviews.filter((r) => r.status === "active");
  const summary = ratingsByProduct(visible)[productId];
  const mine = me ? reviews.find((r) => r.customerId === me) : undefined;
  const eligible = me ? await canReview(me, productId) : false;
  const date = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="mt-12 border-t border-brown/10 pt-8" aria-labelledby="reviews-title">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 id="reviews-title" className="text-lg font-semibold text-brown">
          {t.title}
        </h2>
        {summary && (
          <span className="flex items-center gap-2 text-sm text-brown">
            <Stars value={summary.average} size={16} />
            <span className="font-semibold">{summary.average.toFixed(1)}</span>
            <span className="text-brown-soft">· {format(t.count, { n: summary.count })}</span>
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-brown-soft">{t.onlyBuyers}</p>

      {eligible ? (
        <div className="mb-6 max-w-xl">
          <ReviewForm productId={productId} initial={mine ? { rating: mine.rating, body: mine.body } : undefined} />
        </div>
      ) : (
        !me && (
          <p className="mb-6 text-sm">
            <Link href="/narras/login" className="font-medium text-brown underline">
              {t.loginToReview}
            </Link>
          </p>
        )
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-brown-soft">{t.empty}</p>
      ) : (
        <ul className="space-y-5">
          {visible.map((r) => (
            <li key={r._id}>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <Stars value={r.rating} />
                <span className="font-semibold text-brown">{r.name}</span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-brown">{t.verified}</span>
                <span className="text-xs text-brown-soft">{date.format(new Date(r.createdAt))}</span>
              </p>
              {r.body && <p className="mt-1 whitespace-pre-line break-words text-sm text-brown">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
