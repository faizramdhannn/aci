import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { CommentStatus, CommentTarget, ProductComment } from "@/types/store";

/** Visitor comments on looks (Spill Outfit) and products (by.narras). New ones show straight away; the admin can hide (draft) or delete them. */

const COLLECTION = "comments";

export async function listComments(
  opts: { target?: CommentTarget; targetId?: string; status?: CommentStatus } = {}
): Promise<ProductComment[]> {
  const db = await getDb();
  if (!db) {
    return getMemoryStore()
      .comments.filter(
        (c) =>
          (!opts.target || c.target === opts.target) &&
          (!opts.targetId || c.targetId === opts.targetId) &&
          (!opts.status || c.status === opts.status)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const filter: Partial<ProductComment> = {};
  if (opts.target) filter.target = opts.target;
  if (opts.targetId) filter.targetId = opts.targetId;
  if (opts.status) filter.status = opts.status;
  return db.collection<ProductComment>(COLLECTION).find(filter).sort({ createdAt: -1 }).limit(1000).toArray();
}

export async function addComment(input: Pick<ProductComment, "target" | "targetId" | "name" | "body">): Promise<ProductComment> {
  const comment: ProductComment = { ...input, _id: randomUUID(), status: "active", createdAt: new Date().toISOString() };
  const db = await getDb();
  if (!db) getMemoryStore().comments.push(comment);
  else await db.collection<ProductComment>(COLLECTION).insertOne(comment);
  return comment;
}

export async function setCommentStatus(id: string, status: CommentStatus): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    const comment = getMemoryStore().comments.find((c) => c._id === id);
    if (comment) comment.status = status;
    return Boolean(comment);
  }
  return (await db.collection<ProductComment>(COLLECTION).updateOne({ _id: id }, { $set: { status } })).matchedCount === 1;
}

export async function deleteComment(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.comments = store.comments.filter((c) => c._id !== id);
    return;
  }
  await db.collection<ProductComment>(COLLECTION).deleteOne({ _id: id });
}

/** Removes the comments of a deleted look or product. */
export async function deleteCommentsFor(target: CommentTarget, targetId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.comments = store.comments.filter((c) => !(c.target === target && c.targetId === targetId));
    return;
  }
  await db.collection<ProductComment>(COLLECTION).deleteMany({ target, targetId });
}
