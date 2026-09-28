import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader, ProductStatusBadge, formatDate } from "@/components/admin/store/ui";
import { CommentRowActions } from "@/components/admin/comment-row-actions";
import { listComments } from "@/lib/comments";
import { listShoppableImages } from "@/lib/data";
import { listStoreProducts } from "@/lib/store/data";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import type { CommentStatus, CommentTarget } from "@/types/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).admin.comments.title };
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const params = await searchParams;
  const status = params.status === "active" || params.status === "draft" ? (params.status as CommentStatus) : undefined;
  const source = params.source === "look" || params.source === "product" ? (params.source as CommentTarget) : undefined;

  const [t, locale, all, looks, products] = await Promise.all([
    getStoreDictionary(),
    getLocale(),
    listComments(),
    listShoppableImages(),
    listStoreProducts(),
  ]);
  const c = t.admin.comments;
  const comments = all.filter((x) => (!status || x.status === status) && (!source || x.target === source));

  const titleOf = (target: CommentTarget, id: string) => {
    if (target === "look") {
      const look = looks.find((l) => l._id === id);
      return look ? { label: look.title, href: `/p/${look.slug}` } : null;
    }
    const product = products.find((p) => p._id === id);
    return product ? { label: product.title, href: `/narras/p/${product.slug}` } : null;
  };

  const href = (next: { status?: string; source?: string }) => {
    const q = new URLSearchParams();
    const s = "status" in next ? next.status : status;
    const src = "source" in next ? next.source : source;
    if (s) q.set("status", s);
    if (src) q.set("source", src);
    const qs = q.toString();
    return `/admin/comments${qs ? `?${qs}` : ""}`;
  };
  const tab = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
      active ? "border-brown bg-brown text-cream" : "border-brown/15 text-brown-soft hover:text-brown"
    }`;

  return (
    <div className="max-w-4xl">
      <PageHeader title={c.title} />
      <p className="-mt-4 mb-5 text-sm text-brown-soft">{c.intro}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={href({ status: undefined })} className={tab(!status)}>
          {c.all} ({all.length})
        </Link>
        <Link href={href({ status: "active" })} className={tab(status === "active")}>
          {c.active} ({all.filter((x) => x.status === "active").length})
        </Link>
        <Link href={href({ status: "draft" })} className={tab(status === "draft")}>
          {c.draft} ({all.filter((x) => x.status === "draft").length})
        </Link>
        <span className="mx-1 w-px bg-brown/15" />
        <Link href={href({ source: undefined })} className={tab(!source)}>
          {c.allSources}
        </Link>
        <Link href={href({ source: "look" })} className={tab(source === "look")}>
          {t.admin.outfitSection}
        </Link>
        <Link href={href({ source: "product" })} className={tab(source === "product")}>
          {t.admin.section}
        </Link>
      </div>

      <Card className="!p-0">
        {comments.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{c.empty}</p>
        ) : (
          <ul className="divide-y divide-brown/10">
            {comments.map((comment) => {
              const item = titleOf(comment.target, comment.targetId);
              return (
                <li key={comment._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-brown">{comment.name}</span>
                      <ProductStatusBadge active={comment.status === "active"} label={comment.status === "active" ? c.active : c.draft} />
                      <span className="text-xs text-brown-soft">{formatDate(comment.createdAt, locale)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-brown">{comment.body}</p>
                    <p className="mt-1 text-xs text-brown-soft">
                      {c.on} {comment.target === "look" ? t.admin.outfitSection : t.admin.section} ·{" "}
                      {item ? (
                        <Link href={item.href} target="_blank" className="text-orange hover:underline">
                          {item.label}
                        </Link>
                      ) : (
                        c.deletedItem
                      )}
                    </p>
                  </div>
                  <CommentRowActions id={comment._id} status={comment.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
