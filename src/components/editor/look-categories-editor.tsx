"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/types";
import { CategoryChipPicker } from "@/components/admin/category-chip-picker";
import { useToast } from "@/components/ui/toast-provider";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

export function LookCategoriesEditor({
  imageId,
  categories,
  initialCategoryIds,
}: {
  imageId: string;
  categories: Category[];
  initialCategoryIds: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useAdminDictionary();
  const [categoryIds, setCategoryIds] = useState(initialCategoryIds);
  const [saving, setSaving] = useState(false);

  if (categories.length === 0) return null;

  async function toggle(categoryId: string) {
    const previous = categoryIds;
    const next = categoryIds.includes(categoryId)
      ? categoryIds.filter((c) => c !== categoryId)
      : [...categoryIds, categoryId];
    setCategoryIds(next);
    setSaving(true);
    const res = await fetch(`/api/shoppable-images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: next }),
    });
    setSaving(false);

    if (!res.ok) {
      setCategoryIds(previous);
      toast(t.editor.categoriesFailed, "error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brown-soft">
        {t.editor.lookCategories} {saving && <span className="normal-case">· {t.common.saving}</span>}
      </p>
      <CategoryChipPicker categories={categories} selectedIds={categoryIds} onToggle={toggle} />
    </div>
  );
}
