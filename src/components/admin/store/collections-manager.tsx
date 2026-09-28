"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { StoreCollection } from "@/types/store";
import { Card, adminInput, primaryButton } from "@/components/admin/store/ui";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { format } from "@/lib/i18n/dictionaries";

export function CollectionsManager({ collections, counts }: { collections: StoreCollection[]; counts: Record<string, number> }) {
  const t = useStoreDictionary().admin.collections;
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    setBusy(false);
    if (!res.ok) toast(t.failed, "error");
    router.refresh();
    return res.ok;
  }

  async function move(i: number, dir: -1 | 1) {
    const a = collections[i];
    const b = collections[i + dir];
    await Promise.all([
      call(`/api/store/collections/${a._id}`, { method: "PATCH", body: JSON.stringify({ sortOrder: b.sortOrder }) }),
      call(`/api/store/collections/${b._id}`, { method: "PATCH", body: JSON.stringify({ sortOrder: a.sortOrder }) }),
    ]);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (await call("/api/store/collections", { method: "POST", body: JSON.stringify({ name }) })) setName("");
        }}
        className="flex gap-2"
      >
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t.namePlaceholder} className={adminInput} />
        <button type="submit" disabled={busy || !name.trim()} className={`${primaryButton} shrink-0`}>
          {t.add}
        </button>
      </form>

      <Card className="!p-0">
        {collections.length === 0 ? (
          <p className="p-5 text-sm text-brown-soft">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-brown/10">
            {collections.map((c, i) => (
              <li key={c._id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex flex-col">
                  <button type="button" aria-label="↑" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-brown-soft disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="↓"
                    disabled={busy || i === collections.length - 1}
                    onClick={() => move(i, 1)}
                    className="text-brown-soft disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brown">{c.name}</p>
                  <p className="text-xs text-brown-soft">{format(t.products, { n: counts[c._id] ?? 0 })}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const next = window.prompt(t.rename, c.name)?.trim();
                    if (next && next !== c.name) call(`/api/store/collections/${c._id}`, { method: "PATCH", body: JSON.stringify({ name: next }) });
                  }}
                  className="text-xs text-brown hover:underline"
                >
                  {t.rename}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t.deleteConfirm)) call(`/api/store/collections/${c._id}`, { method: "DELETE" });
                  }}
                  className="text-xs text-brown-soft hover:text-red-500"
                >
                  {t.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
