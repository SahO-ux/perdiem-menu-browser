"use client";

import { memo, useCallback } from "react";

import { cn } from "@/lib/utils";
import type { AppCategory } from "@/types/app";

interface CategoryFilterProps {
  categories: AppCategory[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

const pillClass = (active: boolean, disabled: boolean) =>
  cn(
    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
    disabled
      ? "bg-muted text-muted-foreground opacity-50 pointer-events-none"
      : active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/70",
  );

export const CategoryFilter = memo(
  ({ categories, selectedId, onChange, disabled = false }: CategoryFilterProps) => {
    const handleAll = useCallback(() => onChange(null), [onChange]);

    return (
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={handleAll}
          disabled={disabled}
          className={pillClass(selectedId === null, disabled)}
        >
          All
        </button>
        {!disabled &&
          categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={pillClass(selectedId === cat.id, false)}
            >
              {cat.name}
            </button>
          ))}
      </div>
    );
  },
);

CategoryFilter.displayName = "CategoryFilter";
