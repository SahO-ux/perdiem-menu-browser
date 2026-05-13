"use client";

import { memo, useRef, useState, useEffect } from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";

import { MenuItem } from "./MenuItem";
import type { AppMenuItem } from "@/types/app";
import type { VisibleItem } from "@/hooks/useCatalog";

// Rows of 3 cards give a standard restaurant-menu grid feel.
// In production you'd derive this from a ResizeObserver on the container,
// but a fixed 3 is correct for the desktop-first scope of this challenge.
const COLUMNS = 3;
const ROW_HEIGHT = 272; // image (160px) + content (112px)

interface RowData {
  items: VisibleItem[];
  onItemClick: (item: AppMenuItem, availableNow: boolean) => void;
}

const Row = memo(({ index, style, data }: ListChildComponentProps<RowData>) => {
  const start = index * COLUMNS;
  const rowItems = data.items.slice(start, start + COLUMNS);

  return (
    <div style={style} className="flex gap-4 px-4">
      {rowItems.map(({ item, availableNow }) => (
        <div key={item.id} className="flex-1 min-w-0">
          <MenuItem
            item={item}
            availableNow={availableNow}
            onClick={data.onItemClick}
          />
        </div>
      ))}
      {/* Fill empty trailing slots to maintain column widths on the last row */}
      {Array.from({ length: COLUMNS - rowItems.length }).map((_, i) => (
        <div key={`gap-${i}`} className="flex-1" />
      ))}
    </div>
  );
});

Row.displayName = "Row";

interface MenuGridProps {
  items: VisibleItem[];
  onItemClick: (item: AppMenuItem, availableNow: boolean) => void;
}

export const MenuGrid = memo(({ items, onItemClick }: MenuGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(600);

  // Track container height so the virtual list fills the available space exactly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setListHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(items.length / COLUMNS);

  return (
    <div ref={containerRef} className="h-full">
      <FixedSizeList<RowData>
        height={listHeight}
        width="100%"
        itemCount={rowCount}
        itemSize={ROW_HEIGHT}
        itemData={{ items, onItemClick }}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
});

MenuGrid.displayName = "MenuGrid";
