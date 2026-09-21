"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/types";

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Couldn't create that category.");
      return;
    }

    const category = await res.json();
    setCategories((prev) => [...prev, category]);
    setName("");
    router.refresh();
  }

  async function onRename(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setCategories((prev) => prev.map((c) => (c._id === id ? { ...c, name: editName.trim() } : c)));
    setEditingId(null);
    router.refresh();
  }

  async function onToggleActive(category: Category) {
    const isActive = !category.isActive;
    await fetch(`/api/categories/${category._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setCategories((prev) => prev.map((c) => (c._id === category._id ? { ...c, isActive } : c)));
    router.refresh();
  }

  async function onDelete(id: string) {
    setCategories((prev) => prev.filter((c) => c._id !== id));
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function moveOrder(id: string, direction: -1 | 1) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c._id === id);
      const swapIdx = idx + direction;
      if (idx < 0 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

      next.forEach((c, i) => {
        fetch(`/api/categories/${c._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        });
      });

      return next;
    });
  }

  return (
    <div>
      <form onSubmit={onCreate} className="mb-6 flex items-end gap-2">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-brown-soft">New category</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Outerwear"
            className="w-full rounded-lg border border-brown/20 bg-white/40 px-3 py-2 outline-none focus:border-orange"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-orange">{error}</p>}

      {categories.length === 0 ? (
        <p className="text-sm text-brown-soft">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-brown/10 rounded-xl border border-brown/10 bg-white/40">
          {categories.map((category, i) => (
            <li key={category._id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button
                  onClick={() => moveOrder(category._id, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="text-brown-soft hover:text-brown disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveOrder(category._id, 1)}
                  disabled={i === categories.length - 1}
                  aria-label="Move down"
                  className="text-brown-soft hover:text-brown disabled:opacity-30"
                >
                  ▼
                </button>
              </div>

              {editingId === category._id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => onRename(category._id)}
                  onKeyDown={(e) => e.key === "Enter" && onRename(category._id)}
                  className="flex-1 rounded-lg border border-brown/20 bg-cream px-2 py-1 text-sm outline-none focus:border-orange"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingId(category._id);
                    setEditName(category.name);
                  }}
                  className={`flex-1 text-left text-sm ${category.isActive ? "text-brown" : "text-brown-soft line-through"}`}
                >
                  {category.name}
                </button>
              )}

              <button
                onClick={() => onToggleActive(category)}
                className="text-xs font-medium text-brown-soft hover:text-brown"
              >
                {category.isActive ? "Archive" : "Restore"}
              </button>
              <button onClick={() => onDelete(category._id)} className="text-xs font-medium text-brown-soft hover:text-orange">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
