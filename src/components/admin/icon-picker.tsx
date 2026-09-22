"use client";

import { CATEGORY_ICONS } from "@/components/admin/category-icons";

export function IconPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-brown/15 bg-cream p-2">
      {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          aria-label={name}
          aria-pressed={value === name}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            value === name ? "bg-orange text-cream" : "text-brown-soft hover:bg-brown/10 hover:text-brown"
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
