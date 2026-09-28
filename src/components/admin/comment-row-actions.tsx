"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentStatus } from "@/types/store";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

export function CommentRowActions({ id, status }: { id: string; status: CommentStatus }) {
  const t = useStoreDictionary().admin.comments;
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(init: RequestInit) {
    setBusy(true);
    const res = await fetch(`/api/comments/${id}`, init);
    setBusy(false);
    if (!res.ok) {
      toast(t.failed, "error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs">
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status === "active" ? "draft" : "active" }),
          })
        }
        className="rounded-full border border-brown/20 px-3 py-1 text-brown hover:bg-brown/5 disabled:opacity-50"
      >
        {status === "active" ? t.hide : t.show}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm(t.deleteConfirm)) run({ method: "DELETE" });
        }}
        className="px-1 text-brown-soft hover:text-red-500 disabled:opacity-50"
      >
        {t.delete}
      </button>
    </div>
  );
}
