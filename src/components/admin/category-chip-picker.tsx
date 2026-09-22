"use client";

import type { Category } from "@/types";
import { CategoryIcon } from "@/components/admin/category-icons";

export function CategoryChipPicker({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => {
        const active = (selectedIds ?? []).includes(category._id);
        return (
          <button
            key={category._id}
            type="button"
            onClick={() => onToggle(category._id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active ? "border-orange bg-orange text-cream" : "border-brown/20 text-brown-soft hover:text-brown"
            }`}
          >
            <CategoryIcon name={category.icon} className="h-3.5 w-3.5" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
