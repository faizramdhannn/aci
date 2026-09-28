import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ deleteStoredImage: vi.fn(async () => {}), uploadImage: vi.fn() }));

import { addComment, deleteComment, listComments, setCommentStatus } from "@/lib/comments";
import { deleteShoppableImage } from "@/lib/data";
import { deleteStoreProduct } from "@/lib/store/data";

beforeEach(() => {
  globalThis._aciMemoryStore = undefined;
});

describe("comments", () => {
  it("shows new comments, hides drafts from the public list, and deletes", async () => {
    const a = await addComment({ target: "product", targetId: "prod-bergo", name: "Rina", body: "Adem banget" });
    await addComment({ target: "look", targetId: "img-cream-hijab", name: "Dewi", body: "Suka outfitnya" });
    expect(a.status).toBe("active");
    expect(await listComments({ target: "product", targetId: "prod-bergo", status: "active" })).toHaveLength(1);

    await setCommentStatus(a._id, "draft");
    expect(await listComments({ target: "product", targetId: "prod-bergo", status: "active" })).toHaveLength(0);
    expect(await listComments({ status: "draft" })).toHaveLength(1);

    await deleteComment(a._id);
    expect(await listComments()).toHaveLength(1);
  });

  it("removes a look's or product's comments along with it", async () => {
    await addComment({ target: "product", targetId: "prod-bergo", name: "A", body: "hi" });
    await addComment({ target: "look", targetId: "img-cream-hijab", name: "B", body: "hi" });
    await deleteStoreProduct("prod-bergo");
    await deleteShoppableImage("img-cream-hijab");
    expect(await listComments()).toHaveLength(0);
  });
});
