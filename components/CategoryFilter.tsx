"use client";

import { memo, useCallback } from "react";

import { cn } from "@/lib/utils";
import type { AppCategory } from "@/types/app";

interface CategoryFilterProps {
  categories: AppCategory[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

const pillClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
    active
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground hover:bg-muted/70",
  );

export const CategoryFilter = memo(
  ({ categories, selectedId, onChange }: CategoryFilterProps) => {
    const handleAll = useCallback(() => onChange(null), [onChange]);

    return (
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={handleAll} className={pillClass(selectedId === null)}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={pillClass(selectedId === cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    );
  },
);

CategoryFilter.displayName = "CategoryFilter";
