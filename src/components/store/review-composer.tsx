"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMe } from "@/lib/use-me";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { ReviewForm } from "@/components/store/review-form";

/** Review form for buyers who received the product; a login link for guests. Personal, so it loads in the browser. */
export function ReviewComposer({ productId }: { productId: string }) {
  const t = useStoreDictionary().reviews;
  const me = useMe();
  const [state, setState] = useState<{ eligible: boolean; mine: { rating: number; body: string } | null } | null>(null);

  useEffect(() => {
    if (!me?.signedIn) return;
    let cancelled = false;
    fetch(`/api/store/reviews?productId=${encodeURIComponent(productId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [me?.signedIn, productId]);

  if (me && !me.signedIn) {
    return (
      <p className="mb-6 text-sm">
        <Link href="/narras/login" className="font-medium text-brown underline">
          {t.loginToReview}
        </Link>
      </p>
    );
  }
  if (!state?.eligible) return null;
  return (
    <div className="mb-6 max-w-xl">
      <ReviewForm productId={productId} initial={state.mine ?? undefined} />
    </div>
  );
}
