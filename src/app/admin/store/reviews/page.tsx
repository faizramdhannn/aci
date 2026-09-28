import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader, ProductStatusBadge, formatDate } from "@/components/admin/store/ui";
import { ReviewActions } from "@/components/admin/store/review-actions";
import { Stars } from "@/components/store/stars";
import { listReviews } from "@/lib/store/reviews";
import { listStoreProducts } from "@/lib/store/data";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.reviews.title };
}

export default async function AdminReviewsPage() {
  const [t, locale, reviews, products] = await Promise.all([
    getStoreDictionary(),
    getLocale(),
    listReviews(),
    listStoreProducts(),
  ]);
  const r = t.admin.reviews;
  return (
    <div className="max-w-4xl">
      <PageHeader title={r.title} />
      <p className="-mt-4 mb-6 text-sm text-brown-soft">{r.intro}</p>
      <Card className="!p-0">
        {reviews.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{r.empty}</p>
        ) : (
          <ul className="divide-y divide-brown/10">
            {reviews.map((review) => {
              const product = products.find((p) => p._id === review.productId);
              return (
                <li key={review._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <Stars value={review.rating} />
                      <span className="font-semibold text-brown">{review.name}</span>
                      <ProductStatusBadge
                        active={review.status === "active"}
                        label={review.status === "active" ? t.admin.comments.active : t.admin.comments.draft}
                      />
                      <span className="text-xs text-brown-soft">{formatDate(review.createdAt, locale)}</span>
                    </p>
                    {review.body && <p className="mt-1 whitespace-pre-line break-words text-sm text-brown">{review.body}</p>}
                    {product && (
                      <Link href={`/narras/p/${product.slug}`} target="_blank" className="mt-1 inline-block text-xs text-orange hover:underline">
                        {product.title}
                      </Link>
                    )}
                  </div>
                  <ReviewActions id={review._id} status={review.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
