import type { CommentTarget } from "@/types/store";
import { listComments } from "@/lib/comments";
import { getLocale, getStoreDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";
import { CommentForm } from "@/components/comments/comment-form";

/** Public comment thread (active comments only) plus the form to add one. */
export async function CommentsSection({ target, targetId }: { target: CommentTarget; targetId: string }) {
  const [comments, dict, locale] = await Promise.all([
    listComments({ target, targetId, status: "active" }),
    getStoreDictionary(),
    getLocale(),
  ]);
  const t = dict.comments;
  const date = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <section className="mt-12 border-t border-brown/10 pt-8" aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-4 text-lg font-semibold text-brown">
        {comments.length > 0 ? format(t.count, { n: comments.length }) : t.title}
      </h2>
      <CommentForm target={target} targetId={targetId} />
      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-brown-soft">{t.empty}</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li key={c._id} className="flex gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/15 text-sm font-semibold uppercase text-orange"
              >
                {c.name.trim().charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-brown">{c.name}</span>
                  <span className="ml-2 text-xs text-brown-soft">{date.format(new Date(c.createdAt))}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm text-brown">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
